import sys
import os
sys.path.insert(0, '.')

# Set up a test database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app import models  # This will import all models

# Use an in-memory SQLite database for testing
engine = create_engine('sqlite:///:memory:', echo=True)
Base.metadata.create_all(engine)

print("Tables created successfully")

# Test that we can create a session
Session = sessionmaker(bind=engine)
session = Session()

# Try to create a user, client, and tone profile to see if relationships work
from app.models import User, Client, ToneProfile

# Create a user
user = User(
    email="test@example.com",
    hashed_password="hashed",
    full_name="Test User"
)
session.add(user)
session.commit()

# Create a tone profile owned by the user
tone_profile = ToneProfile(
    owner_id=user.id,
    name="Test Tone",
    formality_level=5,
    verbosity_level=5
)
session.add(tone_profile)
session.commit()

# Create a client owned by the user and with the tone profile
client = Client(
    owner_id=user.id,
    name="Test Client",
    tone_profile_id=tone_profile.id
)
session.add(client)
session.commit()

# Now try to access the relationships
print("User's clients:", [c.name for c in user.clients])
print("Tone profile's clients:", [c.name for c in tone_profile.clients])
print("Client's owner:", client.owner.email)
print("Client's tone profile:", client.tone_profile.name if client.tone_profile else None)

print("Test passed!")
