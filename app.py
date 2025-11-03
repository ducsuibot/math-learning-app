# === 1. IMPORT THƯ VIỆN ===
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
# from flask_socketio import SocketIO # <-- ĐÃ XÓA
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError, Optional, NumberRange
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from groq import Groq
import re
import random
import os
from datetime import datetime

# === 2. KHỞI TẠO FLASK APP, DB, LOGINMANAGER ===
app = Flask(__name__)
app.config['SECRET_KEY'] = 'thay_the_bang_chuoi_bi_mat_rat_kho_doan_cua_ban' # !! NHỚ THAY ĐỔI !!

# === CẤU HÌNH DATABASE (Hỗ trợ Render Postgres và Local SQLite) ===
DATABASE_URL = os.environ.get('DATABASE_URL') 
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
else:
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'doraemon_math.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
# === KẾT THÚC CẤU HÌNH DATABASE ===

# socketio = SocketIO(app) # <-- ĐÃ XÓA

# Cấu hình Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Bạn cần đăng nhập để truy cập trang này."
login_manager.login_message_category = "info"

# === 3. ĐỊNH NGHĨA MODEL USER ===
class User(UserMixin, db.Model):
    # ... (code model User giữ nguyên) ...
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    hobbies = db.Column(db.Text, nullable=True)
    scores = db.relationship('GameScore', backref='player', lazy=True)
    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)
    def __repr__(self): return f'<User {self.username}>'

# === 4. HÀM USER LOADER ===
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# === 5. ĐỊNH NGHĨA MODEL GAME SCORE ===
class GameScore(db.Model):
    # ... (code model GameScore giữ nguyên) ...
    id = db.Column(db.Integer, primary_key=True)
    game_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    def __repr__(self): return f'<GameScore {self.game_name}: {self.score}>'

# === 6. ĐỊNH NGHĨA CÁC FORM ===
class RegistrationForm(FlaskForm):
    # ... (code form giữ nguyên) ...
    username = StringField('Tên đăng nhập', validators=[DataRequired(), Length(min=4, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email(message='Địa chỉ email không hợp lệ.')])
    password = PasswordField('Mật khẩu', validators=[DataRequired(), Length(min=6, message='Mật khẩu phải có ít nhất 6 ký tự.')])
    confirm_password = PasswordField('Xác nhận mật khẩu', validators=[DataRequired(), EqualTo('password', message='Mật khẩu xác nhận phải khớp.')])
    submit = SubmitField('Đăng ký')
    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user: raise ValidationError('Tên đăng nhập đã tồn tại.')
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user: raise ValidationError('Email đã tồn tại.')

class LoginForm(FlaskForm):
    # ... (code form giữ nguyên) ...
    username = StringField('Tên đăng nhập', validators=[DataRequired()])
    password = PasswordField('Mật khẩu', validators=[DataRequired()])
    submit = SubmitField('Đăng nhập')

class EditProfileForm(FlaskForm):
    # ... (code form giữ nguyên) ...
    username = StringField('Tên đăng nhập', validators=[DataRequired(), Length(min=4, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    full_name = StringField('Tên đầy đủ', validators=[Optional(), Length(max=120)])
    gender = SelectField('Giới tính', choices=[('', '-- Chọn --'), ('Nam', 'Nam'), ('Nữ', 'Nữ'), ('Khác', 'Khác')], validators=[Optional()])
    age = IntegerField('Tuổi', validators=[Optional(), NumberRange(min=3, max=120, message='Tuổi không hợp lệ.')])
    hobbies = TextAreaField('Sở thích', validators=[Optional(), Length(max=500)])
    submit = SubmitField('Cập nhật thông tin')
    def __init__(self, original_username, original_email, *args, **kwargs):
        super(EditProfileForm, self).__init__(*args, **kwargs)
        self.original_username = original_username
        self.original_email = original_email
    def validate_username(self, username):
        if username.data != self.original_username:
            user = User.query.filter_by(username=username.data).first()
            if user: raise ValidationError('Tên đăng nhập đã tồn tại.')
    def validate_email(self, email):
        if email.data != self.original_email:
            user = User.query.filter_by(email=email.data).first()
            if user: raise ValidationError('Email đã tồn tại.')

# === 7. CẤU HÌNH GROQ API VÀ HÀM CHATBOT ===
# ... (Toàn bộ code Groq và hàm ask_groq_doraemon giữ nguyên) ...
GROQ_API_KEY = os.getenv('GROQ_API_KEY') 
client = None 
groq_configured = False 
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        groq_configured = True
        print(">>> Đã kết nối Groq API thành công!")
    except Exception as e:
        print(f"!!!!!!!!!!!!!! LỖI KHỞI TẠO GROQ CLIENT !!!!!!!!!!!!!!\n{e}\n!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
else:
    print("!!!!!!!!!!!!!! CẢNH BÁO: Không tìm thấy GROQ_API_KEY trong biến môi trường! Chatbot có thể không hoạt động. !!!!!!!!!!!!!!")

def ask_groq_doraemon(user_message):
    if not groq_configured or not client: 
        return "Lỗi: Không thể kết nối Groq API. Vui lòng kiểm tra API Key hoặc biến môi trường."
    try:
        system_prompt = """
        Bạn là Doraemon, một chú mèo máy thông minh và tốt bụng đến từ tương lai.
        Bạn rất giỏi toán học cơ bản (cộng, trừ, nhân, chia cho trẻ em) và cần dạy 1 đứa bé học toán.
        Hãy trả lời câu hỏi của bé một cách thân thiện, vui vẻ, và trả lời phải thật là siêu hài hước và cute dễ thương nhé nhé.
        Chỉ tập trung trả lời các câu hỏi liên quan đến toán học cơ bản hoặc lời chào hỏi đơn giản.
        Nếu người dùng hỏi về chủ đề khác, hãy từ chối một cách lịch sự và nhắc họ hỏi về toán.
        Giữ câu trả lời ngắn gọn, dễ hiểu.
        """
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            model="openai/gpt-oss-20b",
        )
        reply = chat_completion.choices[0].message.content
        return reply.strip()
    except Exception as e:
        print(f"Lỗi khi gọi Groq API: {e}")
        error_message = str(e).lower()
        if "authentication" in error_message or "api key" in error_message or "invalid" in error_message:
             return "Ối, API key của tớ hình như có vấn đề rồi..."
        if "model_not_found" in error_message or "decommissioned" in error_message:
             return "Ối, model tớ đang dùng không hoạt động nữa rồi..."
        if "rate limit" in error_message:
             return "Từ từ thôi Nobita, tớ đang trả lời hơi nhiều, đợi chút nhé!"
        return "Ối, tớ đang gặp chút trục trặc kỹ thuật mất rồi..."


# === 8. ĐỊNH NGHĨA CÁC ROUTE ===
# ... (Tất cả các route @app.route(...) của bạn giữ nguyên ở đây) ...
@app.route('/')
def index(): return render_template('index.html')
@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated: return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Đăng ký thành công! Giờ hãy đăng nhập.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='Đăng Ký', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated: return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Tên đăng nhập hoặc mật khẩu không đúng!', 'danger')
            return redirect(url_for('login'))
        login_user(user)
        flash(f'Chào mừng {user.username}!', 'success')
        next_page = request.args.get('next')
        return redirect(next_page) if next_page else redirect(url_for('index'))
    return render_template('login.html', title='Đăng Nhập', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Bạn đã đăng xuất.', 'info')
    return redirect(url_for('index'))

@app.route('/profile')
@login_required
def profile(): return render_template('profile.html', title='Thông Tin Cá Nhân', user=current_user)

@app.route('/edit_profile', methods=['GET', 'POST'])
@login_required
def edit_profile():
    form = EditProfileForm(current_user.username, current_user.email)
    if form.validate_on_submit():
        current_user.username = form.username.data
        current_user.email = form.email.data
        current_user.full_name = form.full_name.data
        current_user.gender = form.gender.data
        current_user.age = form.age.data
        current_user.hobbies = form.hobbies.data
        db.session.commit()
        flash('Thông tin đã được cập nhật!', 'success')
        return redirect(url_for('profile'))
    elif request.method == 'GET':
        form.username.data = current_user.username
        form.email.data = current_user.email
        form.full_name.data = current_user.full_name
        form.gender.data = current_user.gender
        form.age.data = current_user.age
        form.hobbies.data = current_user.hobbies
    return render_template('edit_profile.html', title='Cập Nhật Thông Tin', form=form)

@app.route('/learning')
@login_required
def learning(): return render_template('learning.html')

@app.route('/save_score', methods=['POST'])
@login_required
def save_score():
    data = request.get_json()
    game_name = data.get('game_name')
    score_value = data.get('score')
    if game_name and score_value is not None:
        try:
            new_score = GameScore(game_name=game_name, score=int(score_value), player=current_user)
            db.session.add(new_score)
            db.session.commit()
            return jsonify({"message": "Lưu điểm thành công!"}), 201
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi khi lưu điểm: {e}")
            return jsonify({"error": "Không thể lưu điểm"}), 500
    else:
        return jsonify({"error": "Thiếu tên game hoặc điểm số"}), 400

@app.route('/practice')
def practice(): return render_template('practice.html')
@app.route('/compare-images')
def compare_images(): return render_template('compare_images.html')
@app.route('/plus-minus-game')
def plus_minus_game(): return render_template('plus_minus_game.html')
@app.route('/ocean-rescue')
def ocean_rescue_game(): return render_template('ocean_rescue.html')
@app.route('/chatbot')
def chatbot_page(): return render_template('chat.html')
@app.route('/ask_doraemon', methods=['POST'])
def ask_doraemon():
    user_message = request.json.get('message')
    if not user_message: return jsonify({"reply": "Cậu chưa nói gì cả!"})
    bot_reply = ask_groq_doraemon(user_message)
    return jsonify({"reply": bot_reply})
# Thêm vào file app.py
@app.route('/time-machine-game')
def time_machine_game():
    return render_template('time_machine_game.html')
# Thêm vào file app.py
@app.route('/suneo-shopping-game')
@login_required # Bạn có thể thêm @login_required nếu muốn
def suneo_shopping_game():
    return render_template('suneo_shopping.html')


# === 9. CHẠY SERVER (ĐÃ SỬA LẠI ĐỂ CHẠY LOCAL) ===
if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Tạo bảng nếu chưa có
    print("Khởi động server...")
    # Dùng app.run() tiêu chuẩn thay vì socketio.run()
    app.run(debug=True, port=5000)