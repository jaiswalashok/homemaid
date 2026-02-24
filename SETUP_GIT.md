# Git Repository Setup Guide

This guide will help you push the HomeMaid project to the GitHub repository under the jaiswalashok account.

## Prerequisites

1. GitHub account: `jaiswalashok`
2. Repository created: `https://github.com/jaiswalashok/homemaid`
3. Git installed on your machine

## Setup Steps

### 1. Configure Git User (if switching from aeropriest)

```bash
# Set your git user for this repository
git config user.name "jaiswalashok"
git config user.email "ashok@homemaid.jaiswals.live"

# Verify the configuration
git config user.name
git config user.email
```

### 2. Check Current Git Status

```bash
# Check if git is initialized
git status

# Check current remotes
git remote -v
```

### 3. Add Remote Repository

```bash
# Add the GitHub repository as remote origin
git remote add origin https://github.com/jaiswalashok/homemaid.git

# Or if origin already exists, update it
git remote set-url origin https://github.com/jaiswalashok/homemaid.git
```

### 4. Stage and Commit Files

```bash
# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: HomeMaid family AI assistant

- Next.js web application with API services
- React Native mobile app (Expo)
- Privacy policy and terms of use
- Environment configuration
- Vercel deployment setup
"
```

### 5. Push to GitHub

```bash
# Push to main branch
git branch -M main
git push -u origin main
```

## Authentication Options

### Option 1: HTTPS with Personal Access Token (Recommended)

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Use the token as your password when pushing

### Option 2: SSH Key

1. Generate SSH key:
```bash
ssh-keygen -t ed25519 -C "ashok@homemaid.jaiswals.live"
```

2. Add SSH key to GitHub account
3. Update remote to use SSH:
```bash
git remote set-url origin git@github.com:jaiswalashok/homemaid.git
```

## Verify Setup

```bash
# Check remote configuration
git remote -v

# Check branch
git branch

# View commit history
git log --oneline
```

## Common Issues

### Issue: Permission denied
**Solution:** Ensure you're authenticated with the jaiswalashok account, not aeropriest

### Issue: Remote already exists
**Solution:** Use `git remote set-url origin <new-url>` instead of `git remote add`

### Issue: Untracked files
**Solution:** Check `.gitignore` is properly configured

## Next Steps After Push

1. Configure Vercel deployment
2. Set up environment variables in Vercel
3. Connect custom domain: homemaid.jaiswals.live
4. Enable automatic deployments from main branch

---

**Need help?** Contact ashok@homemaid.jaiswals.live
