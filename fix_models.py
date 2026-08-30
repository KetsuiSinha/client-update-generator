lines = []
with open('server/app/models.py', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    if stripped == 'clients = relationship("Client", back_populates="owner")':
        # Replace this line and the next? Actually, it's one line.
        # We want to replace this one line with four lines.
        new_lines.append('    clients = relationship(\n')
        new_lines.append('        "Client",\n')
        new_lines.append('        back_populates="owner",\n')
        new_lines.append('        foreign_keys=[Client.owner_id]\n')
        new_lines.append('    )\n')
        i += 1
    elif stripped == 'owner = relationship("User", back_populates="clients")':
        new_lines.append('    owner = relationship(\n')
        new_lines.append('        "User",\n')
        new_lines.append('        back_populates="clients",\n')
        new_lines.append('        foreign_keys=[Client.owner_id],\n')
        new_lines.append('        primaryjoin="Client.owner_id == User.id"\n')
        new_lines.append('    )\n')
        i += 1
    elif stripped == 'tone_profile = relationship(':
        # We have to capture until the closing parenthesis.
        # We know the current block is 5 lines (from line 46 to 50 in the original, but after changes it might be different?).
        # We'll take the next 4 lines (so total 5 lines) and replace them.
        # But note: the current block is:
        #     tone_profile = relationship(
        #         "ToneProfile",
        #         back_populates="clients",
        #         foreign_keys=[tone_profile_id]
        #     )
        # We want to replace it with:
        #     tone_profile = relationship(
        #         "ToneProfile",
        #         back_populates="clients",
        #         foreign_keys=[tone_profile_id],
        #         primaryjoin="Client.tone_profile_id == ToneProfile.id"
        #     )
        # So we take the current line and the next 4 lines (index i to i+4) and replace with 7 lines.
        new_lines.append('    tone_profile = relationship(\n')
        new_lines.append('        "ToneProfile",\n')
        new_lines.append('        back_populates="clients",\n')
        new_lines.append('        foreign_keys=[tone_profile_id],\n')
        new_lines.append('        primaryjoin="Client.tone_profile_id == ToneProfile.id"\n')
        new_lines.append('    )\n')
        i += 5   # skip the current line and the next 4
    elif stripped == 'clients = relationship("Client", back_populates="tone_profile")':
        new_lines.append('    clients = relationship(\n')
        new_lines.append('        "Client",\n')
        new_lines.append('        back_populates="tone_profile",\n')
        new_lines.append('        foreign_keys=[Client.tone_profile_id],\n')
        new_lines.append('        primaryjoin="ToneProfile.id == Client.tone_profile_id"\n')
        new_lines.append('    )\n')
        i += 1
    else:
        new_lines.append(line)
        i += 1

with open('server/app/models.py', 'w') as f:
    f.writelines(new_lines)
