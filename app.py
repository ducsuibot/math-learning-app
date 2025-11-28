# === 1. IMPORT THƯ VIỆN ===
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
# from flask_socketio import SocketIO # <-- ĐÃ XÓA
from flask_wtf import FlaskForm
# Import các trường và validators từ wtforms MỘT LẦN ở đầu file
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectField, TextAreaField, RadioField
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
# !! QUAN TRỌNG: Thay đổi chuỗi này thành một chuỗi bí mật thực sự, dài và ngẫu nhiên !!
app.config['SECRET_KEY'] = 'thay_the_bang_chuoi_bi_mat_rat_kho_doan_cua_ban'

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

# Cấu hình Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Bạn cần đăng nhập để truy cập trang này."
login_manager.login_message_category = "info"

# === 3. ĐỊNH NGHĨA MODEL USER (ĐÃ ĐƠN GIẢN HÓA) ===
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    hobbies = db.Column(db.Text, nullable=True)
    
    # [MỚI] Trường lưu số điểm hiện có (để tiêu xài)
    current_points = db.Column(db.Integer, default=0) 

    # [MỚI] Các vật phẩm phần thưởng đặc biệt
    buff_time_add = db.Column(db.Integer, default=0)      # Bình tăng thời gian
    buff_skip_question = db.Column(db.Integer, default=0) # Vé đổi câu hỏi
    buff_double_score = db.Column(db.Integer, default=0)  # Nhân đôi điểm
    
    scores = db.relationship('GameScore', backref='player', lazy=True)
    # [MỚI] Quan hệ với túi đồ
    inventory = db.relationship('UserInventory', backref='owner', lazy=True)

    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)
    def __repr__(self): return f'<User {self.username}>'


# [MỚI] Model Túi Đồ
class UserInventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    item_id = db.Column(db.String(50), nullable=False) # Lưu key của vật phẩm (ví dụ: 'item_chongchong')
    quantity = db.Column(db.Integer, default=1)        # Số lượng sở hữu

# === 4. HÀM USER LOADER ===
@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# === 5. ĐỊNH NGHĨA MODEL GAME SCORE ===
class GameScore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    game_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    def __repr__(self): return f'<GameScore {self.game_name}: {self.score}>'

# === 6. ĐỊNH NGHĨA CÁC FORM ===
class RegistrationForm(FlaskForm):
    username = StringField('Tên đăng nhập', validators=[DataRequired(), Length(min=4, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email(message='Email không hợp lệ.')])
    password = PasswordField('Mật khẩu', validators=[DataRequired(), Length(min=6, message='Tối thiểu 6 ký tự.')])
    confirm_password = PasswordField('Xác nhận mật khẩu', validators=[DataRequired(), EqualTo('password', message='Mật khẩu phải khớp.')])
    # Đã xóa ô chọn role
    submit = SubmitField('Đăng ký')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user: raise ValidationError('Tên đăng nhập đã tồn tại.')
    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user: raise ValidationError('Email đã tồn tại.')

class LoginForm(FlaskForm):
    username = StringField('Tên đăng nhập', validators=[DataRequired()])
    password = PasswordField('Mật khẩu', validators=[DataRequired()])
    submit = SubmitField('Đăng nhập')

class EditProfileForm(FlaskForm):
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
GROQ_API_KEY = os.getenv('GROQ_API_KEY') 
client = None 
groq_configured = False 
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        groq_configured = True
        print(">>> Đã kết nối Groq API thành công!")
    except Exception as e:
        print(f"Lỗi Groq Client: {e}")
else:
    print("CẢNH BÁO: Không tìm thấy GROQ_API_KEY!")

def ask_groq_doraemon(user_message):
    if not groq_configured or not client: 
        return "Lỗi: Không thể kết nối Groq API."
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
        print(f"Lỗi gọi Groq API: {e}")
        error_message = str(e).lower()
        if "authentication" in error_message or "api key" in error_message or "invalid" in error_message:
             return "Ối, API key của tớ hình như có vấn đề rồi..."
        if "model_not_found" in error_message or "decommissioned" in error_message:
             return "Ối, model tớ đang dùng không hoạt động nữa rồi..."
        if "rate limit" in error_message:
             return "Từ từ thôi Nobita, tớ đang trả lời hơi nhiều, đợi chút nhé!"
        return "Ối, tớ đang gặp chút trục trặc kỹ thuật mất rồi..."

# === 8. ĐỊNH NGHĨA CÁC ROUTE ===
@app.route('/')
def index(): 
    return render_template('index.html')

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
def profile(): 
    return render_template('profile.html', title='Thông Tin Cá Nhân', user=current_user)

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
def learning(): 
    return render_template('learning.html')

@app.route('/save_score', methods=['POST'])
@login_required 
def save_score():
    data = request.get_json()
    game_name = data.get('game_name')
    score_value = data.get('score')
    
    if game_name and score_value is not None:
        try:
            score_int = int(score_value)
            # 1. Lưu lịch sử điểm số
            new_score = GameScore(
                game_name=game_name, 
                score=score_int, 
                player=current_user
            )
            db.session.add(new_score)
            
            # 2. [MỚI] Cộng điểm vào ví tiền của user
            # Nếu user chưa có trường current_points (do db cũ), hãy xử lý lỗi hoặc set default=0
            if current_user.current_points is None:
                current_user.current_points = 0
            current_user.current_points += score_int
            
            db.session.commit()
            return jsonify({"message": f"Lưu thành công! Bạn nhận được {score_int} điểm."}), 201
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi khi lưu điểm: {e}")
            return jsonify({"error": "Không thể lưu điểm"}), 500
    else:
        return jsonify({"error": "Thiếu tên game hoặc điểm số"}), 400

@app.route('/practice')
def practice(): 
    return render_template('practice.html')
@app.route('/compare-images')
def compare_images(): 
    return render_template('compare_images.html')
@app.route('/plus-minus-game')
def plus_minus_game(): 
    return render_template('plus_minus_game.html')
@app.route('/ocean-rescue')
def ocean_rescue_game(): 
    return render_template('ocean_rescue.html')
@app.route('/chatbot')
def chatbot_page(): 
    return render_template('chat.html')
@app.route('/ask_doraemon', methods=['POST'])
def ask_doraemon():
    user_message = request.json.get('message')
    if not user_message: return jsonify({"reply": "Cậu chưa nói gì cả!"})
    bot_reply = ask_groq_doraemon(user_message) 
    return jsonify({"reply": bot_reply})

@app.route('/time-machine-game')
def time_machine_game():
    return render_template('time_machine_game.html')
@app.route('/suneo-shopping-game')
@login_required
def suneo_shopping_game():
    return render_template('suneo_shopping.html')

# --- Route Trang Thống Kê Của Bé (MỚI) ---
@app.route('/my_stats')
@login_required
def my_stats():
    chart_data_avg = None
    chart_data_line = None
    chart_data_pie = None
    data_summary_for_ai = "Bé chưa chơi game nào."

    # Query 1: Lấy điểm trung bình
    scores_avg = db.session.query(
        GameScore.game_name, 
        db.func.avg(GameScore.score).label('average_score')
    ).filter_by(user_id=current_user.id).group_by(GameScore.game_name).all()

    if scores_avg:
        labels_avg = [translate_game_name(s.game_name) for s in scores_avg] # Dùng hàm dịch
        data_avg = [round(s.average_score, 1) for s in scores_avg]
        chart_data_avg = {"labels": labels_avg, "data": data_avg}
        
        data_summary_for_ai = f"Dữ liệu điểm trung bình của bé {current_user.username}:\n"
        for s in scores_avg:
            data_summary_for_ai += f"- {translate_game_name(s.game_name)}: {round(s.average_score, 1)} điểm\n" # Dùng hàm dịch
    
    # Query 2: Lấy tiến độ điểm theo thời gian
    scores_over_time = GameScore.query.filter_by(user_id=current_user.id).order_by(GameScore.timestamp.asc()).limit(10).all()
    if scores_over_time:
        labels_line = [s.timestamp.strftime('%d/%m') for s in scores_over_time]
        data_line = [s.score for s in scores_over_time]
        chart_data_line = {"labels": labels_line, "data": data_line}

    # Query 3: Lấy tỷ lệ chơi các game
    game_counts = db.session.query(
        GameScore.game_name, 
        db.func.count(GameScore.game_name).label('play_count')
    ).filter_by(user_id=current_user.id).group_by(GameScore.game_name).all()
    if game_counts:
        labels_pie = [translate_game_name(g.game_name) for g in game_counts] # Dùng hàm dịch
        data_pie = [g.play_count for g in game_counts]
        chart_data_pie = {"labels": labels_pie, "data": data_pie}
    
    return render_template('my_stats.html', 
                           title='Thống Kê Của Bé',
                           chart_data_avg=chart_data_avg,
                           chart_data_line=chart_data_line,
                           chart_data_pie=chart_data_pie,
                           data_summary_for_ai=data_summary_for_ai)

# --- Route AI Báo Cáo (MỚI) ---
@app.route('/generate_student_report', methods=['POST'])
@login_required
def generate_student_report():
    data_summary = request.json.get('data')
    if not data_summary:
        return jsonify({"report": "Không có dữ liệu để phân tích."})
    if not groq_configured or not client: 
        return jsonify({"report": "Lỗi: Không thể kết nối Groq API."})

    try:
        system_prompt = f"""
        Bạn là Doraemon, đang viết báo cáo cho bé Nobita.
        Dưới đây là dữ liệu điểm trung bình của bé:
        {data_summary}
        
        Hãy viết một báo cáo ngắn gọn (khoảng 3-4 câu) cho bé:
        1. Khen ngợi chung về tình hình học tập (dựa trên điểm số).
        2. Chỉ ra bé giỏi nhất game nào (game có điểm cao nhất).
        3. Động viên bé cố gắng ở game có điểm thấp nhất (nếu có).
        Viết với giọng văn của Doraemon: thân thiện, hài hước, và động viên, gọi bé là "cậu".
        Bắt đầu báo cáo bằng một lời chào vui vẻ!
        """
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Hãy viết báo cáo cho tớ!"}
            ],
            model="openai/gpt-oss-20b",
        )
        reply = chat_completion.choices[0].message.content
        return jsonify({"report": reply.strip()})
    except Exception as e:
        print(f"Lỗi khi gọi Groq API (Báo cáo): {e}")
        return jsonify({"report": "Ối, tớ đang gặp chút trục trặc khi tạo báo cáo..."}), 500

# === HÀM PHỤ ĐỂ DỊCH TÊN GAME ===
# (Cần đặt TRƯỚC route /my_stats)
GAME_NAME_MAP = {
    'ocean_rescue': 'Giải cứu Mimi',
    'compare_images': 'So sánh hình',
    'plus-minus-game': 'Trò chơi cộng trừ',
    'suneo_shopping_game': 'Siêu thị Xeko',
    # Thêm các tên game khác (tên trong DB : tên muốn hiển thị)
}
def translate_game_name(db_name):
    """Hàm dịch tên game từ DB sang tên tiếng Việt"""
    return GAME_NAME_MAP.get(db_name, db_name) # Trả về tên tiếng Việt, nếu không có thì trả về tên gốc



# ... (giữ nguyên các import và cấu hình cũ)

# --- LOGIC CỬA HÀNG VÀ TÚI ĐỒ ---

# Định nghĩa các vật phẩm (có thể lưu trong DB hoặc hardcode đơn giản như này)
ITEMS_DATA = {
    'item_chongchong': {'name': 'Chong chóng tre', 'price': 50, 'img': 'item_chongchong.png'},
    'item_canhcua': {'name': 'Cánh cửa thần kỳ', 'price': 100, 'img': 'item_canhcua.png'},
    'item_denden': {'name': 'Đèn pin thu nhỏ', 'price': 80, 'img': 'item_denden.png'},
    'item_banhmi': {'name': 'Bánh mì chuyển ngữ', 'price': 60, 'img': 'item_banhmi.png'},
    'item_khantraiphu': {'name': 'Khăn trùm thời gian', 'price': 90, 'img': 'item_khantraiphu.png'},
    'item_co_may': {'name': 'Cỗ máy thời gian', 'price': 200, 'img': 'item_co_may.png'},
    'item_dai_bang': {'name': 'Mối duyên vương vấn', 'price': 10000, 'img': 'moi_duyen_vuong_van.png'},
    'item_vong_xuyen': {'name': 'Mối duyên tương ngộ', 'price': 10000, 'img': 'moi_duyen_tuong_ngo.png'},
    'item_gang_tay': {'name': 'Găng tay sức mạnh', 'price': 60, 'img': 'item_gang_tay.png'},
    'item_mu_da': {'name': 'Mũ đá cuội', 'price': 40, 'img': 'item_mu_da.png'}
}

# === CẬP NHẬT ROUTE inventory ===
@app.route('/inventory')
@login_required
def inventory():
    # Lấy danh sách vật phẩm từ DB của user hiện tại
    user_inventory = UserInventory.query.filter_by(user_id=current_user.id).all()
    
    # Truyền cả danh sách inventory (DB) và thông tin chi tiết vật phẩm (Dictionary)
    return render_template('inventory.html', 
                           user_inventory=user_inventory, 
                           item_data=ITEMS_DATA)

# === CẬP NHẬT ROUTE shop ===
@app.route('/shop')
@login_required
def shop():
    # Truyền thêm current_points để hiển thị số tiền user đang có
    return render_template('shop.html', items=ITEMS_DATA, user_points=current_user.current_points)

# === CẬP NHẬT ROUTE buy_item (Logic mua hàng thật sự) ===
@app.route('/buy_item/<item_id>', methods=['POST'])
@login_required
def buy_item(item_id):
    item_info = ITEMS_DATA.get(item_id)
    if not item_info:
        return jsonify({'success': False, 'msg': 'Vật phẩm không tồn tại!'})
    
    price = item_info['price']
    
    # Kiểm tra điểm
    if current_user.current_points is None: current_user.current_points = 0
    
    if current_user.current_points >= price:
        try:
            # 1. Trừ tiền
            current_user.current_points -= price
            
            # 2. Kiểm tra xem user đã có vật phẩm này chưa
            existing_item = UserInventory.query.filter_by(user_id=current_user.id, item_id=item_id).first()
            
            if existing_item:
                # Nếu có rồi -> Tăng số lượng
                existing_item.quantity += 1
            else:
                # Nếu chưa có -> Tạo mới
                new_item = UserInventory(user_id=current_user.id, item_id=item_id, quantity=1)
                db.session.add(new_item)
            
            db.session.commit()
            
            return jsonify({
                'success': True, 
                'msg': f'Đã mua {item_info["name"]} thành công!',
                'new_balance': current_user.current_points # Trả về số dư mới để update giao diện
            })
            
        except Exception as e:
            db.session.rollback()
            print(f"Lỗi mua hàng: {e}")
            return jsonify({'success': False, 'msg': 'Có lỗi xảy ra khi giao dịch.'})
    else:
        return jsonify({'success': False, 'msg': 'Bạn không đủ điểm để mua vật phẩm này!'})


# --- Thêm vào app.py ---

# Route giao diện nhiệm vụ
@app.route('/missions')
@login_required
def missions():
    return render_template('missions.html')

# API: Nobita tạo nhiệm vụ mới
@app.route('/api/generate_mission', methods=['POST'])
@login_required
def generate_mission():
    # 1. Chọn ngẫu nhiên 1 hoặc 2 bảo bối từ Shop
    all_item_ids = list(ITEMS_DATA.keys())
    # Chọn 1-2 món ngẫu nhiên
    required_items_ids = random.sample(all_item_ids, k=random.randint(1, 2))
    
    required_items_info = []
    item_names_str = ""
    
    for i_id in required_items_ids:
        item = ITEMS_DATA[i_id]
        qty = random.randint(1, 3) # Số lượng cần: 1 đến 3 cái
        required_items_info.append({
            "id": i_id,
            "name": item['name'],
            "img": item['img'],
            "qty": qty
        })
        item_names_str += f"{qty} cái {item['name']}, "

    # 2. Nhờ AI (Nobita) bịa chuyện
    prompt = f"""
    Bạn là Nobita, đang nói chuyện với Doraemon (người dùng).
    Hãy bịa ra một lý do cực kỳ khẩn cấp, hài hước, hoặc ngớ ngẩn (bị Chaien bắt nạt, bị chó rượt, quên làm bài tập, muốn trốn mẹ đi chơi...) để xin Doraemon cho bạn: {item_names_str}.
    Giọng văn: Mè nheo, khẩn khoản, gọi người dùng là "Doraemon ơi".
    Chỉ viết ngắn gọn trong 2-3 câu.
    """
    
    try:
        story = ask_groq_doraemon(prompt) # Tái sử dụng hàm chat AI cũ
    except:
        story = f"Doraemon ơi cứu tớ! Tớ cần {item_names_str} gấp lắm rồi!"

    # Lưu nhiệm vụ hiện tại vào session để tránh gian lận (tùy chọn, ở đây làm đơn giản trả về client)
    return jsonify({
        "story": story,
        "requirements": required_items_info
    })

# API: Nộp bài (Trả nhiệm vụ)
@app.route('/api/submit_mission', methods=['POST'])
@login_required
def submit_mission():
    data = request.json
    requirements = data.get('requirements', [])
    
    if not requirements:
        return jsonify({"success": False, "msg": "Không có nhiệm vụ nào!"})

    # 1. Kiểm tra túi đồ
    for req in requirements:
        item_id = req['id']
        qty_needed = req['qty']
        
        user_item = UserInventory.query.filter_by(user_id=current_user.id, item_id=item_id).first()
        
        if not user_item or user_item.quantity < qty_needed:
            item_name = ITEMS_DATA[item_id]['name']
            return jsonify({"success": False, "msg": f"Cậu chưa có đủ {qty_needed} cái {item_name}! Ra Shop mua nhanh lên!"})

    # 2. Trừ đồ và Trao thưởng
    try:
        # Trừ đồ
        for req in requirements:
            item_id = req['id']
            qty_needed = req['qty']
            user_item = UserInventory.query.filter_by(user_id=current_user.id, item_id=item_id).first()
            user_item.quantity -= qty_needed
            if user_item.quantity == 0:
                db.session.delete(user_item)
        
        # Random phần thưởng
        reward_type = random.choice(['time', 'skip', 'double'])
        reward_msg = ""
        
        if reward_type == 'time':
            current_user.buff_time_add = (current_user.buff_time_add or 0) + 1
            reward_msg = "⏳ 1 Bình Tăng Thời Gian (Dùng trong Game)"
        elif reward_type == 'skip':
            current_user.buff_skip_question = (current_user.buff_skip_question or 0) + 1
            reward_msg = "🎫 1 Vé Đổi Câu Hỏi"
        else:
            current_user.buff_double_score = (current_user.buff_double_score or 0) + 1
            reward_msg = "✨ 1 Huy Hiệu Nhân Đôi Điểm"

        db.session.commit()
        return jsonify({
            "success": True, 
            "msg": f"Cảm ơn Doraemon! Cậu là cứu tinh của tớ! <br><b>Phần thưởng:</b> {reward_msg}"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "msg": f"Lỗi server: {str(e)}"})
# --------------------------------------------------------
# ... (giữ nguyên các route cũ)
# === 9. CHẠY SERVER (ĐÃ VÔ HIỆU HÓA ĐỂ DEPLOY) ===
#if __name__ == '__main__':
#     with app.app_context():
#         db.create_all() # Tạo bảng nếu chưa có
#     print("Khởi động server...")
#     app.run(debug=True, port=5000)