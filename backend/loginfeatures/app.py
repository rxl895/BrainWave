from flask import Flask, url_for, session, redirect, render_template, request, flash
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
import os
from functools import wraps
import base64

app = Flask(__name__)
app.secret_key = os.urandom(24)  # In production, use a stable secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'  # Use PostgreSQL in production
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Initialize encryption key (store securely in production!)
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

# User model with encrypted fields
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    # Encrypted fields
    encrypted_uid = db.Column(db.LargeBinary)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def set_uid(self, uid):
        self.encrypted_uid = cipher_suite.encrypt(uid.encode())
    
    def get_uid(self):
        return cipher_suite.decrypt(self.encrypted_uid).decode()

# Initialize OAuth
oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    if 'user' in session:
        email = session['user'].get('email', 'User')
        return f'Hello {email}!'
    return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user'] = {'email': user.email}
            return redirect('/')
        flash('Invalid credentials')
        return redirect(url_for('login'))
    
    return google.authorize_redirect(url_for('authorize', _external=True))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        uid = request.form.get('uid')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered')
            return redirect(url_for('register'))
        
        user = User(email=email)
        user.set_password(password)
        user.set_uid(uid)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/authorize')
def authorize():
    token = google.authorize_access_token()
    resp = google.get('userinfo')
    user_info = resp.json()
    
    # Check if user exists, if not, create one
    email = user_info.get('email')
    user = User.query.filter_by(email=email).first()
    if not user:
        # For OAuth users, generate a random password
        random_password = base64.b64encode(os.urandom(24)).decode('utf-8')
        user = User(email=email)
        user.set_password(random_password)
        user.set_uid(f"oauth_{email}")  # Default UID for OAuth users
        db.session.add(user)
        db.session.commit()
    
    session['user'] = user_info
    return redirect('/')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect('/')

@app.route('/protected')
@login_required
def protected():
    user = User.query.filter_by(email=session['user']['email']).first()
    if user:
        return f'Protected page. Your UID is: {user.get_uid()}'
    return 'Protected page'

# Create database tables
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
