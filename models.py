from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

# Khởi tạo db
db = SQLAlchemy()

# 1. Bảng Users (Người dùng/Phụ huynh)
class User(db.Model, UserMixin):
    __tablename__ = 'users'
    # Lưu ý: Dùng 'id' cho chuẩn với Flask-Login
    id = db.Column(db.Integer, primary_key=True) 
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120), nullable=True)
    role = db.Column(db.String(20), default='user') # admin/user
    gender = db.Column(db.String(10), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    hobbies = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # [MỚI] Trường lưu số điểm hiện có (để tiêu xài trong Shop)
    current_points = db.Column(db.Integer, default=0) 

    # [MỚI] Các vật phẩm phần thưởng đặc biệt (Buffs)
    buff_time_add = db.Column(db.Integer, default=0)      # Bình tăng thời gian
    buff_skip_question = db.Column(db.Integer, default=0) # Vé đổi câu hỏi
    buff_double_score = db.Column(db.Integer, default=0)  # Nhân đôi điểm

    # Quan hệ với các bảng khác
    children = db.relationship('Child', backref='parent', lazy=True)
    settings = db.relationship('Setting', backref='user', uselist=False, lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True)
    feedback = db.relationship('Feedback', backref='user', lazy=True)
    
    # Quan hệ Game & Túi đồ (QUAN TRỌNG)
    scores = db.relationship('GameScore', backref='player', lazy=True)
    inventory = db.relationship('UserInventory', backref='owner', lazy=True)

    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)
    def get_id(self): return str(self.id)
    def __repr__(self): return f'<User {self.username}>'

# 2. Bảng Children (Hồ sơ của bé)
class Child(db.Model):
    __tablename__ = 'children'
    child_id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    birth_date = db.Column(db.Date)
    gender = db.Column(db.String(10))
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    progress = db.relationship('Progress', backref='child', lazy=True)
    rewards = db.relationship('Reward', backref='child', lazy=True)

# 3. Bảng Lessons (Bài học)
class Lesson(db.Model):
    __tablename__ = 'lessons'
    lesson_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    level = db.Column(db.String(20))
    subject = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    exercises = db.relationship('Exercise', backref='lesson', lazy=True)
    progress_records = db.relationship('Progress', backref='lesson', lazy=True)

# 4. Bảng Exercises (Bài tập)
class Exercise(db.Model):
    __tablename__ = 'exercises'
    exercise_id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.lesson_id'), nullable=False)
    question = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(100))
    option_b = db.Column(db.String(100))
    option_c = db.Column(db.String(100))
    option_d = db.Column(db.String(100))
    correct_answer = db.Column(db.String(10))
    image_url = db.Column(db.String(255))

# 5. Bảng Progress (Tiến độ học tập chính thống)
class Progress(db.Model):
    __tablename__ = 'progress'
    progress_id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.child_id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.lesson_id'), nullable=False)
    score = db.Column(db.Integer, default=0)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    total_questions = db.Column(db.Integer)
    correct_answers = db.Column(db.Integer)
    time_spent = db.Column(db.Integer)

# 6. Bảng GameScore (Lưu điểm các mini-game: Giải cứu đại dương, Đếm ngón tay...)
class GameScore(db.Model):
    __tablename__ = 'game_scores'
    id = db.Column(db.Integer, primary_key=True)
    game_name = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    def __repr__(self): return f'<GameScore {self.game_name}: {self.score}>'

# 7. Bảng UserInventory (Túi đồ của người dùng)
class UserInventory(db.Model):
    __tablename__ = 'user_inventory'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_id = db.Column(db.String(50), nullable=False) # ID vật phẩm (ví dụ: item_chongchong)
    quantity = db.Column(db.Integer, default=1)

# 8. Bảng Rewards (Phần thưởng thành tựu)
class Reward(db.Model):
    __tablename__ = 'rewards'
    reward_id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.child_id'), nullable=False)
    title = db.Column(db.String(100))
    description = db.Column(db.Text)
    earned_date = db.Column(db.DateTime, default=datetime.utcnow)

# 9. Bảng Notifications (Thông báo)
class Notification(db.Model):
    __tablename__ = 'notifications'
    noti_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

# 10. Bảng Settings (Cài đặt)
class Setting(db.Model):
    __tablename__ = 'settings'
    setting_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    language = db.Column(db.String(20), default='vi')
    sound_enabled = db.Column(db.Boolean, default=True)
    theme = db.Column(db.String(20), default='default')

# 11. Bảng Feedback (Phản hồi)
class Feedback(db.Model):
    __tablename__ = 'feedback'
    feedback_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)