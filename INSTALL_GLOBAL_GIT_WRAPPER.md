# Global Git Push Wrapper Installation

This guide sets up a global `gpush` command that always asks which GitHub account to use.

## Quick Install

Run these commands to install the global git wrapper:

```bash
# Create bin directory if it doesn't exist
mkdir -p ~/.local/bin

# Make the script executable
chmod +x ~/.local/bin/git-push-account

# Add to PATH (choose your shell)
# For zsh (default on macOS):
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For bash:
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Create alias for easier use
echo 'alias gpush="git-push-account"' >> ~/.zshrc  # or ~/.bashrc
source ~/.zshrc  # or source ~/.bashrc
```

## Usage

Instead of `git push`, use:

```bash
gpush
```

Or with arguments:

```bash
gpush -u origin main
gpush --force
gpush origin feature-branch
```

The script will:
1. Show you which GitHub account to use
2. Update your local git config
3. Update the remote URL if needed
4. Test SSH connection
5. Execute the push

## Alternative: Override git push

If you want to completely replace `git push`:

```bash
# Add to ~/.zshrc or ~/.bashrc
git() {
    if [ "$1" = "push" ]; then
        shift
        git-push-account "$@"
    else
        command git "$@"
    fi
}
```

Then just use `git push` as normal - it will always ask for account selection.

## Account Configuration

Edit `~/.local/bin/git-push-account` to customize your accounts:

```bash
ACCOUNTS[1]="Personal (aeropriest)|github-personal|aeropriest|your-email@example.com"
ACCOUNTS[2]="Company|github-company|company-username|company@email.com"
ACCOUNTS[3]="Jaiswals (jaiswalashok)|github-jaiswals|jaiswalashok|ashok@jaiswals.live"
```

## SSH Setup Required

Each account needs:
1. SSH key generated
2. SSH config entry
3. Public key added to GitHub

See `GITHUB_MULTI_ACCOUNT_SETUP.md` for details.
