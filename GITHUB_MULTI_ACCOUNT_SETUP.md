# Managing Multiple GitHub Accounts

This guide helps you manage 3 GitHub accounts:
1. **Personal** - aeropriest
2. **Company** - your company account
3. **Jaiswals Family** - jaiswalashok (ashok@jaiswals.live)

## Method 1: SSH Keys (Recommended)

This method uses different SSH keys for each account.

### Step 1: Generate SSH Keys for Each Account

```bash
# Personal account (aeropriest)
ssh-keygen -t ed25519 -C "ashok.jaiswal@gmail.com" -f ~/.ssh/id_ed25519_aeropriest

# Company account
ssh-keygen -t ed25519 -C "ashok@kyozo.com" -f ~/.ssh/id_ed25519_kyozo

# Jaiswals account (jaiswalashok)
ssh-keygen -t ed25519 -C "ashok@jaiswals.live" -f ~/.ssh/id_ed25519_jaiswals_live
```

### Step 2: Add SSH Keys to SSH Agent
`
```bash
eval "$(ssh-agent -s)"

ssh-add ~/.ssh/id_ed25519_aeropriest
ssh-add ~/.ssh/id_ed25519_kyozo
ssh-add ~/.ssh/id_ed25519_jaiswals_live
```

### Step 3: Add Public Keys to GitHub Accounts

Copy each public key and add to the respective GitHub account:

```bash
# Copy personal key
cat ~/.ssh/id_ed25519_aeropriest.pub | pbcopy

# Copy company key
cat ~/.ssh/id_ed25519_kyozo.pub | pbcopy

# Copy jaiswals key
cat ~/.ssh/id_ed25519_jaiswals_live.pub | pbcopy
```

Then add each key to Settings → SSH and GPG keys in the respective GitHub accounts.

### Step 4: Configure SSH Config File

Create/edit `~/.ssh/config`:

```bash
# Personal GitHub (aeropriest)
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_aeropriest
    IdentitiesOnly yes

# Company GitHub
Host github-company
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_kyozo
    IdentitiesOnly yes

# Jaiswals GitHub (jaiswalashok)
Host github-jaiswals
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_jaiswals_live
    IdentitiesOnly yes
```

### Step 5: Configure Git for HomeMaid Project

```bash
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid

# Set local git config for this project
git config user.name "jaiswalashok"
git config user.email "ashok@jaiswals.live"

# Add remote using the SSH host alias
git remote add origin git@github-jaiswals:jaiswalashok/homemaid.git

# Or update existing remote
git remote set-url origin git@github-jaiswals:jaiswalashok/homemaid.git
```

### Step 6: Push to Repository

```bash
git add .
git commit -m "Initial commit: HomeMaid family AI assistant"
git branch -M main
git push -u origin main
```

## Method 2: HTTPS with Credential Helper

Use different credentials for each repository.

### Step 1: Configure Git Credential Helper

```bash
git config --global credential.helper osxkeychain
```

### Step 2: Configure Per-Repository

```bash
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid

# Set local config
git config user.name "jaiswalashok"
git config user.email "ashok@jaiswals.live"

# Add HTTPS remote
git remote add origin https://github.com/jaiswalashok/homemaid.git
```

### Step 3: Use Personal Access Tokens

When pushing, Git will prompt for credentials:
- **Username:** jaiswalashok
- **Password:** [Personal Access Token for jaiswalashok account]

Create tokens at: GitHub Settings → Developer settings → Personal access tokens

## Method 3: GitHub CLI (gh)

```bash
# Install GitHub CLI
brew install gh

# Authenticate with multiple accounts
gh auth login

# Switch between accounts
gh auth switch

# Set account for specific operation
gh repo clone jaiswalashok/homemaid --auth-token YOUR_TOKEN
```

## Quick Setup for HomeMaid (Recommended)

For this project, use SSH method:

```bash
# 1. Generate SSH key for jaiswalashok
ssh-keygen -t ed25519 -C "ashok@jaiswals.live" -f ~/.ssh/id_ed25519_jaiswals_live

# 2. Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519_jaiswals_live

# 3. Copy public key and add to GitHub
cat ~/.ssh/id_ed25519_jaiswals_live.pub | pbcopy
# Go to https://github.com/settings/keys and add the key

# 4. Add SSH config entry
cat >> ~/.ssh/config << 'EOF'

# Jaiswals GitHub (jaiswalashok)
Host github-jaiswals
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_jaiswals_live
    IdentitiesOnly yes
EOF

# 5. Configure HomeMaid repository
cd /Users/ashokjaiswal/Development/Jaiswals/HomeMaid
git config user.name "jaiswalashok"
git config user.email "ashok@jaiswals.live"
git remote add origin git@github-jaiswals:jaiswalashok/homemaid.git

# 6. Push to GitHub
git add .
git commit -m "Initial commit: HomeMaid family AI assistant"
git branch -M main
git push -u origin main
```

## Verify Which Account You're Using

```bash
# Check local repository config
git config user.name
git config user.email

# Check remote URL
git remote -v

# Test SSH connection
ssh -T git@github-jaiswals
# Should return: Hi jaiswalashok! You've successfully authenticated...
```

## Switching Between Projects

When working on different projects:

```bash
# For personal projects (aeropriest)
git remote set-url origin git@github-personal:aeropriest/repo-name.git

# For company projects
git remote set-url origin git@github-company:company/repo-name.git

# For Jaiswals projects (jaiswalashok)
git remote set-url origin git@github-jaiswals:jaiswalashok/repo-name.git
```

## Troubleshooting

### Issue: Wrong account being used
```bash
# Check which SSH key is being used
ssh -vT git@github-jaiswals

# Verify SSH config
cat ~/.ssh/config
```

### Issue: Permission denied
```bash
# Ensure SSH key is added to agent
ssh-add -l

# Re-add if needed
ssh-add ~/.ssh/id_ed25519_jaiswals_live
```

### Issue: Commits showing wrong author
```bash
# Check local config
git config user.name
git config user.email

# Set correct values
git config user.name "jaiswalashok"
git config user.email "ashok@jaiswals.live"
```

---

**Note:** Always verify you're using the correct account before pushing sensitive code!
