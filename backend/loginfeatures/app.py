import json
from os import environ as env
from urllib.parse import quote_plus, urlencode
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv
from flask import Flask, redirect, render_template, session, url_for, request, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = Flask(__name__)
app.secret_key = env.get("APP_SECRET_KEY")

# Configure SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = env.get("DATABASE_URL", "sqlite:///users.db")
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    auth0_id = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    full_name = db.Column(db.String(200), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)

oauth = OAuth(app)
oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration',
)

@app.route("/")
def home():
    return {"message": "Backend is running! Connect via API."}


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        # This route will handle the initial registration form
        return oauth.auth0.authorize_redirect(
            redirect_uri=url_for("registration_callback", _external=True)
        )
    return render_template("register.html")

@app.route("/registration_callback")
def registration_callback():
    token = oauth.auth0.authorize_access_token()
    userinfo = token.get('userinfo', {})
    
    # Store basic Auth0 info in session
    session["user"] = token
    
    # Get the Auth0 ID
    auth0_id = userinfo.get('sub')
    
    # Check if user already exists
    existing_user = User.query.filter_by(auth0_id=auth0_id).first()
    if existing_user:
        flash("Account already exists! Please login instead.")
        return redirect(url_for("login"))
    
    # Create new user with Auth0 data
    new_user = User(
        auth0_id=auth0_id,
        email=userinfo.get('email'),
        username=userinfo.get('nickname'),
        full_name=userinfo.get('name'),
        last_login=datetime.utcnow()
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    # Redirect to complete profile
    return redirect(url_for("complete_profile"))

@app.route("/complete_profile", methods=["GET", "POST"])
def complete_profile():
    if not session.get("user"):
        return redirect(url_for("login"))
    
    auth0_id = session["user"]["userinfo"]["sub"]
    user = User.query.filter_by(auth0_id=auth0_id).first()
    
    if request.method == "POST":
        # Update additional user information
        user.bio = request.form.get("bio")
        user.full_name = request.form.get("full_name")
        username = request.form.get("username")
        
        # Check if username is already taken
        if User.query.filter(User.username == username, User.id != user.id).first():
            flash("Username already taken!")
            return render_template("complete_profile.html", user=user)
        
        user.username = username
        db.session.commit()
        flash("Profile updated successfully!")
        return redirect(url_for("home"))
    
    return render_template("complete_profile.html", user=user)

@app.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    
    userinfo = token.get('userinfo', {})
    auth0_id = userinfo.get('sub')
    
    user = User.query.filter_by(auth0_id=auth0_id).first()
    if user:
        user.last_login = datetime.utcnow()
        db.session.commit()
    
    return redirect("/")

@app.route("/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://"
        + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )

def init_db():
    with app.app_context():
        db.create_all()

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=env.get("PORT", 3000))
