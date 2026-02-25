# Quick Fix: Push to GitHub

You got the "Permission denied (publickey)" error because the SSH key isn't added to GitHub yet.

## Immediate Solution (Choose One)

### Option 1: Run the Fix Script (Easiest)

```bash
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid
chmod +x fix-ssh-and-push.sh
./fix-ssh-and-push.sh
```

This will:
- Generate SSH key if needed
- Configure SSH
- Show you the public key
- Guide you to add it to GitHub
- Push your code

### Option 2: Manual Steps

```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "ashok@jaiswals.live" -f ~/.ssh/id_ed25519_jaiswals

# 2. Start SSH agent and add key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_jaiswals

# 3. Copy public key
cat ~/.ssh/id_ed25519_jaiswals.pub | pbcopy

# 4. Add to GitHub
# Go to: https://github.com/settings/ssh/new
# Paste the key and save

# 5. Add SSH config
cat >> ~/.ssh/config << 'EOF'

Host github-jaiswals
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_jaiswals
    IdentitiesOnly yes
EOF

# 6. Push
git push -u origin main
```

## For Future: Global Git Push with Account Selection

After fixing the immediate issue, install the global wrapper:

```bash
# Make script executable
chmod +x ~/.local/bin/git-push-account

# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
echo 'alias gpush="git-push-account"' >> ~/.zshrc
source ~/.zshrc

# Now use 'gpush' instead of 'git push'
# It will always ask which account to use!
```

## Why This Happened

Your remote is configured to use `git@github-jaiswals` (SSH), but:
1. The SSH key doesn't exist yet, OR
2. The SSH key isn't added to your GitHub account, OR
3. The SSH key isn't loaded in your SSH agent

The fix script handles all of this automatically.
