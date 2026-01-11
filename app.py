# === 1. IMPORT THƯ VIỆN ===
import os
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, IntegerField, SelectField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Optional, NumberRange, ValidationError
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from groq import Groq

# Flask-Admin
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView

# Import db và models từ file models.py (QUAN TRỌNG)
from models import db, User, Child, Lesson, Exercise, Progress, Feedback, GameScore, UserInventory, Reward, Notification, Setting

# === 2. KHỞI TẠO FLASK APP ===
app = Flask(__name__)

# === CẤU HÌNH DATABASE ===
basedir = os.path.abspath(os.path.dirname(__file__))
DATABASE_URL = os.environ.get('DATABASE_URL') 
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL or 'sqlite:///' + os.path.join(basedir, 'doraemon_math.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'thay_the_bang_chuoi_bi_mat_rat_kho_doan_cua_ban'

# === KHỞI TẠO DB (SỬA LỖI 1: CHỈ DÙNG init_app) ===
# Xóa dòng db = SQLAlchemy(app) đi, chỉ giữ lại dòng này:
db.init_app(app) 

# Cấu hình Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = "Bạn cần đăng nhập để truy cập trang này."
login_manager.login_message_category = "info"

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))
# === 3. CẤU HÌNH ADMIN DASHBOARD ===
class MyAdminIndexView(AdminIndexView):
    def is_accessible(self):
        # Kiểm tra quyền Admin
        return current_user.is_authenticated and current_user.role == 'admin'

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('login', next=request.url))

    @expose('/')
    def index(self):
        try:
            # Thống kê cơ bản
            stats = {
                'total_users': User.query.count(),
                'total_children': Child.query.count(),
                'total_lessons': Lesson.query.count(),
                'total_score': db.session.query(db.func.sum(GameScore.score)).scalar() or 0, # Tổng điểm chơi game
                'total_feedbacks': Feedback.query.count()
            }
        except:
            stats = {'total_users':0, 'total_children':0, 'total_lessons':0, 'total_score':0, 'total_feedbacks':0}
        return self.render('admin/dashboard_index.html', stats=stats)

# Class cơ bản bảo mật (các view khác sẽ kế thừa từ đây)
class SecureModelView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated and current_user.role == 'admin'
    
    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('login'))
    
    page_size = 20
    can_export = True
    create_modal = True
    edit_modal = True

# --- CÁC VIEW TÙY CHỈNH CHO TỪNG BẢNG ---

class UserModelView(SecureModelView):
    column_exclude_list = ['password_hash']
    column_searchable_list = ['username', 'email', 'full_name']
    column_filters = ['role', 'created_at', 'current_points']
    column_labels = {
        'username': 'Tên đăng nhập', 'email': 'Email', 'full_name': 'Họ tên',
        'role': 'Quyền', 'current_points': 'Điểm hiện có', 'created_at': 'Ngày tạo'
    }

class ChildModelView(SecureModelView):
    column_list = ['name', 'parent', 'birth_date', 'gender', 'created_at']
    column_labels = {'name': 'Tên bé', 'parent': 'Phụ huynh', 'birth_date': 'Sinh nhật', 'gender': 'Giới tính'}
    column_searchable_list = ['name']

class ExerciseModelView(SecureModelView):
    column_list = ['lesson', 'question', 'correct_answer', 'level']
    column_filters = ['lesson.title', 'correct_answer']
    form_columns = ['lesson', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'image_url']

class GameScoreModelView(SecureModelView):
    column_list = ['player', 'game_name', 'score', 'timestamp']
    column_labels = {'player': 'Người chơi', 'game_name': 'Tên Game', 'score': 'Điểm số', 'timestamp': 'Thời gian'}
    column_filters = ['game_name', 'score', 'timestamp']
    column_searchable_list = ['player.username', 'game_name']

class InventoryModelView(SecureModelView):
    column_list = ['owner', 'item_id', 'quantity']
    column_labels = {'owner': 'Sở hữu', 'item_id': 'Mã vật phẩm', 'quantity': 'Số lượng'}
    column_filters = ['item_id']

class FeedbackModelView(SecureModelView):
    column_list = ['user', 'content', 'created_at']
    column_labels = {'user': 'Người gửi', 'content': 'Nội dung', 'created_at': 'Ngày gửi'}
    can_create = False # Admin chỉ xem phản hồi, không tạo phản hồi giả

# --- HÀM SETUP ADMIN ---
def setup_admin(app):
    admin = Admin(app, 
                  name='Doraemon Admin', 
                  index_view=MyAdminIndexView(name='Tổng quan', url='/admin')) # Thêm bootstrap4 cho đẹp
    
    # 1. Nhóm Người dùng
    admin.add_view(UserModelView(User, db.session, name='User', category='Người dùng'))

    # 3. Nhóm Game & Shop (MỚI)
    admin.add_view(GameScoreModelView(GameScore, db.session, name='Lịch sử chơi Game', category='Nội dung'))
    admin.add_view(InventoryModelView(UserInventory, db.session, name='Kho vật phẩm', category='Nội dung'))
    admin.add_view(SecureModelView(Reward, db.session, name='Thành tựu/Phần thưởng', category='Nội dung'))

    # 4. Nhóm Hệ thống
    admin.add_view(SecureModelView(Notification, db.session, name='Thông báo', category='Hệ thống'))
    admin.add_view(FeedbackModelView(Feedback, db.session, name='Phản hồi', category='Hệ thống'))

# Kích hoạt Admin
setup_admin(app)

with app.app_context():
    db.create_all() # Đảm bảo bảng User đã tồn tại
    admin_user = User.query.filter_by(username='admin').first()
    if not admin_user:
        admin_user = User(username='admin', email='admin@doraemon.com', role='admin')
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.commit()
        print(">>> Đã tạo tài khoản admin thành công!")
    else:
        # Cập nhật lại role admin nếu tài khoản đã tồn tại nhưng chưa có quyền
        admin_user.role = 'admin'
        db.session.commit()

# === 4. CẤU HÌNH GROQ API ===
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
    if not groq_configured or not client: return "Lỗi: Không thể kết nối Groq API."
    try:
        system_prompt = """Bạn là Doraemon, một chú mèo máy thông minh. Hãy trả lời câu hỏi thật ngắn trong 2 đến 3 dòng."""
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_message}],
            model="openai/gpt-oss-20b",
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        return "Ối, tớ đang gặp chút trục trặc kỹ thuật..."

def ask_groq_story_teller(story_prompt):
    if not groq_configured or not client: return "Lỗi: Không thể kết nối Groq API."
    try:
        system_prompt = """Bạn là Nobita, đang nói chuyện với Doraemon thật ngắn gọn trong 2 đến 3 dòng. Hãy nghĩ ra một lý do khẩn cấp để xin bảo bối. Giọng văn khẩn khoản, gọi "Doraemon ơi"."""
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": story_prompt}],
            model="openai/gpt-oss-20b",
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        return "Ối, tớ đang gặp chút trục trặc khi nghĩ ra câu chuyện..."

# === 5. CÁC FORM FLASK-WTF ===
class RegistrationForm(FlaskForm):
    username = StringField('Tên đăng nhập', validators=[DataRequired(), Length(min=4, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email(message='Email không hợp lệ.')])
    password = PasswordField('Mật khẩu', validators=[DataRequired(), Length(min=6, message='Tối thiểu 6 ký tự.')])
    confirm_password = PasswordField('Xác nhận mật khẩu', validators=[DataRequired(), EqualTo('password', message='Mật khẩu phải khớp.')])
    submit = SubmitField('Đăng ký')
    def validate_username(self, username):
        if User.query.filter_by(username=username.data).first(): raise ValidationError('Tên đăng nhập đã tồn tại.')
    def validate_email(self, email):
        if User.query.filter_by(email=email.data).first(): raise ValidationError('Email đã tồn tại.')

class LoginForm(FlaskForm):
    username = StringField('Tên đăng nhập', validators=[DataRequired()])
    password = PasswordField('Mật khẩu', validators=[DataRequired()])
    submit = SubmitField('Đăng nhập')

class EditProfileForm(FlaskForm):
    username = StringField('Tên đăng nhập', validators=[DataRequired(), Length(min=4, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    full_name = StringField('Tên đầy đủ', validators=[Optional(), Length(max=120)])
    gender = SelectField('Giới tính', choices=[('', '-- Chọn --'), ('Nam', 'Nam'), ('Nữ', 'Nữ'), ('Khác', 'Khác')], validators=[Optional()])
    age = IntegerField('Tuổi', validators=[Optional(), NumberRange(min=3, max=120)])
    hobbies = TextAreaField('Sở thích', validators=[Optional(), Length(max=500)])
    submit = SubmitField('Cập nhật thông tin')
    def __init__(self, original_username, original_email, *args, **kwargs):
        super(EditProfileForm, self).__init__(*args, **kwargs)
        self.original_username = original_username
        self.original_email = original_email
    def validate_username(self, username):
        if username.data != self.original_username and User.query.filter_by(username=username.data).first():
            raise ValidationError('Tên đăng nhập đã tồn tại.')
    def validate_email(self, email):
        if email.data != self.original_email and User.query.filter_by(email=email.data).first():
            raise ValidationError('Email đã tồn tại.')

# === 6. DATA & ROUTE ===
ITEMS_DATA = {
    'item_chongchong': {'name': 'Chong chóng tre', 'price': 50, 'img': 'item_chongchong.png'},
    'item_canhcua': {'name': 'Cánh cửa thần kỳ', 'price': 100, 'img': 'item_canhcua.png'},
    'item_denden': {'name': 'Đèn pin thu nhỏ', 'price': 80, 'img': 'item_denden.png'},
    'item_banhmi': {'name': 'Bánh mì chuyển ngữ', 'price': 60, 'img': 'item_banhmi.png'},
    'item_khantraiphu': {'name': 'Khăn trùm thời gian', 'price': 90, 'img': 'item_khantraiphu.png'},
    'item_co_may': {'name': 'Cỗ máy thời gian', 'price': 200, 'img': 'item_co_may.png'},
    'item_dai_bang': {'name': 'Mối duyên vương vấn', 'price': 100, 'img': 'moi_duyen_vuong_van.png'},
    'item_vong_xuyen': {'name': 'Mối duyên tương ngộ', 'price': 100, 'img': 'moi_duyen_tuong_ngo.png'},
    'item_gang_tay': {'name': 'Găng tay sức mạnh', 'price': 60, 'img': 'item_gang_tay.png'},
    'item_mu_da': {'name': 'Mũ đá cuội', 'price': 40, 'img': 'item_mu_da.png'}
}

GAME_NAME_MAP = {
    'ocean_rescue': 'Giải cứu Mimi',
    'compare_images': 'So sánh hình',
    'plus-minus-game': 'Trò chơi cộng trừ',
    'suneo_shopping_game': 'Siêu thị Xeko',
}
def translate_game_name(db_name): return GAME_NAME_MAP.get(db_name, db_name)

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
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Sai tên đăng nhập hoặc mật khẩu!', 'danger')
            return redirect(url_for('login'))
        
        login_user(user)
        
        # --- LOGIC ĐIỀU HƯỚNG MỚI ---
        # Lấy đích đến từ URL (?next=...) hoặc từ form ẩn
        next_page = request.args.get('next')
        
        # Nếu không có đích đến cụ thể, kiểm tra xem họ đăng nhập từ cổng nào
        if not next_page:
            login_type = request.form.get('login_type') # Lấy từ nút bấm
            if login_type == 'parent':
                return redirect(url_for('parent_dashboard')) # Vào trang phụ huynh
            else:
                return redirect(url_for('index')) # Vào trang học tập (Mặc định)
        
        return redirect(next_page)
        
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
            score_int = int(score_value)
            new_score = GameScore(game_name=game_name, score=score_int, player=current_user)
            db.session.add(new_score)
            if current_user.current_points is None: current_user.current_points = 0
            current_user.current_points += score_int
            db.session.commit()
            return jsonify({"message": f"Lưu thành công! Bạn nhận được {score_int} điểm."}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": "Không thể lưu điểm"}), 500
    return jsonify({"error": "Thiếu dữ liệu"}), 400

@app.route('/shop')
@login_required
def shop(): return render_template('shop.html', items=ITEMS_DATA, user_points=current_user.current_points)

@app.route('/buy_item/<item_id>', methods=['POST'])
@login_required
def buy_item(item_id):
    item_info = ITEMS_DATA.get(item_id)
    if not item_info: return jsonify({'success': False, 'msg': 'Vật phẩm không tồn tại!'})
    price = item_info['price']
    if (current_user.current_points or 0) >= price:
        try:
            current_user.current_points -= price
            existing_item = UserInventory.query.filter_by(user_id=current_user.id, item_id=item_id).first()
            if existing_item: existing_item.quantity += 1
            else: db.session.add(UserInventory(user_id=current_user.id, item_id=item_id, quantity=1))
            db.session.commit()
            return jsonify({'success': True, 'msg': f'Đã mua {item_info["name"]}!', 'new_balance': current_user.current_points})
        except:
            db.session.rollback()
            return jsonify({'success': False, 'msg': 'Lỗi giao dịch.'})
    return jsonify({'success': False, 'msg': 'Không đủ điểm!'})

@app.route('/inventory')
@login_required
def inventory():
    user_inventory = UserInventory.query.filter_by(user_id=current_user.id).all()
    return render_template('inventory.html', user_inventory=user_inventory, item_data=ITEMS_DATA)

@app.route('/missions')
@login_required
def missions(): return render_template('missions.html')

@app.route('/api/generate_mission', methods=['POST'])
@login_required
def generate_mission():
    all_ids = list(ITEMS_DATA.keys())
    req_ids = random.sample(all_ids, k=random.randint(1, 2))
    req_info = []
    names = ""
    for i_id in req_ids:
        item = ITEMS_DATA[i_id]
        qty = random.randint(1, 2)
        req_info.append({"id": i_id, "name": item['name'], "img": item['img'], "qty": qty})
        names += f"{qty} cái {item['name']}, "
    
    prompt = f"Hãy nghĩ ra lý do khẩn cấp để xin bảo bối của doraemon thật ngắn gọn trong 2 đến 3 dòng: {names}."
    try: story = ask_groq_story_teller(prompt)
    except: story = f"Cứu tớ với! Tớ cần {names} gấp!"
    return jsonify({"story": story, "requirements": req_info})

@app.route('/api/submit_mission', methods=['POST'])
@login_required
def submit_mission():
    data = request.json
    requirements = data.get('requirements', [])
    if not requirements: return jsonify({"success": False, "msg": "Không có nhiệm vụ!"})

    for req in requirements:
        u_item = UserInventory.query.filter_by(user_id=current_user.id, item_id=req['id']).first()
        if not u_item or u_item.quantity < req['qty']:
            return jsonify({"success": False, "msg": f"Thiếu {ITEMS_DATA[req['id']]['name']}!"})

    try:
        for req in requirements:
            u_item = UserInventory.query.filter_by(user_id=current_user.id, item_id=req['id']).first()
            u_item.quantity -= req['qty']
            if u_item.quantity == 0: db.session.delete(u_item)
        
        reward_type = random.choice(['time', 'skip', 'double'])
        if reward_type == 'time':
            current_user.buff_time_add = (current_user.buff_time_add or 0) + 1
            msg = "⏳ 1 Bình Tăng Thời Gian"
        elif reward_type == 'skip':
            current_user.buff_skip_question = (current_user.buff_skip_question or 0) + 1
            msg = "🎫 1 Vé Đổi Câu Hỏi"
        else:
            current_user.buff_double_score = (current_user.buff_double_score or 0) + 1
            msg = "✨ 1 Huy Hiệu Nhân Đôi Điểm"
        
        db.session.commit()
        return jsonify({"success": True, "msg": f"Cảm ơn cậu! <br><b>Phần thưởng:</b> {msg}"})
    except:
        db.session.rollback()
        return jsonify({"success": False, "msg": "Lỗi server."})

@app.route('/my_stats')
@login_required
def my_stats():
    # 1. Điểm trung bình
    scores_avg = db.session.query(GameScore.game_name, db.func.avg(GameScore.score)).filter_by(user_id=current_user.id).group_by(GameScore.game_name).all()
    chart_avg = {"labels": [translate_game_name(s[0]) for s in scores_avg], "data": [round(s[1], 1) for s in scores_avg]} if scores_avg else None
    
    # 2. Tiến độ
    scores_time = GameScore.query.filter_by(user_id=current_user.id).order_by(GameScore.timestamp.asc()).limit(10).all()
    chart_line = {"labels": [s.timestamp.strftime('%d/%m') for s in scores_time], "data": [s.score for s in scores_time]} if scores_time else None

    # 3. Tỷ lệ chơi
    game_counts = db.session.query(GameScore.game_name, db.func.count(GameScore.game_name)).filter_by(user_id=current_user.id).group_by(GameScore.game_name).all()
    chart_pie = {"labels": [translate_game_name(g[0]) for g in game_counts], "data": [g[1] for g in game_counts]} if game_counts else None

    summary = f"Dữ liệu của bé {current_user.username}:\n" + "\n".join([f"- {translate_game_name(s[0])}: {round(s[1],1)} điểm" for s in scores_avg])
    
    return render_template('my_stats.html', title='Thống Kê', chart_data_avg=chart_avg, chart_data_line=chart_line, chart_data_pie=chart_pie, data_summary_for_ai=summary)

@app.route('/generate_student_report', methods=['POST'])
@login_required
def generate_student_report():
    data = request.json.get('data')
    if not data: return jsonify({"report": "Không có dữ liệu."})
    try:
        prompt = f"Bạn là Doraemon. Viết nhận xét học tập ngắn gọn khoảng 2 - 3 dòng cho bé dựa trên: {data}"
        completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}], model="openai/gpt-oss-20b"
        )
        return jsonify({"report": completion.choices[0].message.content})
    except: return jsonify({"report": "Lỗi tạo báo cáo."})

# Các route game đơn giản
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
    msg = request.json.get('message')
    return jsonify({"reply": ask_groq_doraemon(msg) if msg else "Cậu chưa nói gì!"})
@app.route('/time-machine-game')
def time_machine_game(): return render_template('time_machine_game.html')
@app.route('/suneo-shopping-game')
@login_required
def suneo_shopping_game(): return render_template('suneo_shopping.html')
@app.route('/hoc-so/co-ban')
def suneo_learning_basic(): return render_template('suneo_basic.html') 
@app.route('/hoc-so/nang-cao')
def suneo_challenge_hard(): return render_template('suneo_hard.html')
@app.route('/so-sanh/hai-so')
def shizuka_compare_numbers(): return render_template('shizuka_compare_numbers.html')
@app.route('/so-sanh/sap-xep')
def shizuka_ordering(): return render_template('shizuka_ordering.html')
@app.route('/luyen-tap/phep-tru')
def chaien_subtraction(): return render_template('chaien_medium.html')
@app.route('/luyen-tap/tinh-nhanh')
def chaien_fast_math(): return render_template('chaien_hard.html')

#31/12
# --- ROUTE: DASHBOARD PHỤ HUYNH ---
@app.route('/parent/dashboard')
@login_required
def parent_dashboard():
    # 1. Lấy dữ liệu thống kê (Giống my_stats nhưng chi tiết hơn nếu cần)
    scores_avg = db.session.query(GameScore.game_name, db.func.avg(GameScore.score)).filter_by(user_id=current_user.id).group_by(GameScore.game_name).all()
    chart_avg = {"labels": [translate_game_name(s[0]) for s in scores_avg], "data": [round(s[1], 1) for s in scores_avg]} if scores_avg else None
    
    # 2. Lấy lịch sử 20 lần chơi gần nhất (Table view)
    recent_history = GameScore.query.filter_by(user_id=current_user.id).order_by(GameScore.timestamp.desc()).limit(20).all()
    
    # 3. Lấy dữ liệu cho AI nhận xét
    summary = f"Học sinh {current_user.username}."
    if scores_avg:
        summary += " Điểm trung bình: " + ", ".join([f"{translate_game_name(s[0])}: {round(s[1],1)}" for s in scores_avg])
    else:
        summary += " Chưa có dữ liệu học tập."

    return render_template('parent_dashboard.html', 
                           title='Góc Phụ Huynh',
                           chart_data_avg=chart_avg,
                           recent_history=recent_history,
                           data_summary_for_ai=summary,
                           now=datetime.now().strftime("%H:%M %d/%m/%Y")) # Thêm dòng này)

# --- ROUTE: GỬI PHẢN HỒI ---
@app.route('/parent/send_feedback', methods=['POST'])
@login_required
def send_feedback():
    content = request.form.get('content')
    if content:
        # Lưu vào Database
        fb = Feedback(user_id=current_user.id, content=content)
        db.session.add(fb)
        db.session.commit()
        flash('Cảm ơn quý phụ huynh! Phản hồi đã được gửi tới Admin.', 'success')
    else:
        flash('Vui lòng nhập nội dung phản hồi.', 'warning')
    return redirect(url_for('parent_dashboard'))
#end 30/12

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Tạo admin mẫu nếu chưa có
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@doraemon.com', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print(">>> Đã tạo tài khoản admin mẫu (User: admin / Pass: admin123)")

        # 2. THÊM MỚI: Tạo tài khoản user mẫu (user / 123123)
        if not User.query.filter_by(username='user').first():
            # Cần email giả vì model yêu cầu email
            test_user = User(username='user', email='user@doraemon.com', role='user') 
            test_user.set_password('123123')
            db.session.add(test_user)
            db.session.commit()
            print(">>> Đã tạo tài khoản test (User: user / Pass: 123123)")

    print(">>> Khởi động server...")
    app.run(debug=True, port=5000)