# Contributing to SkillArc LMS

Thank you for your interest in contributing to the SkillArc Learning Management System! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites
- PHP 8.x
- MySQL 8.0
- Node.js 18+ and npm
- Apache/Nginx web server

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/shemaarafati2020/SkillArc-Learning-Management-System.git
   cd SkillArc-Learning-Management-System
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Import the database schema**
   ```bash
   mysql -u your_user -p lms_db < backend/config/schema.sql
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Configure your web server** to point to `backend/api/` as the API root.

## Development Guidelines

### Code Style
- **PHP**: Follow PSR-12 coding standards
- **JavaScript/React**: Use ESLint with the project configuration
- **CSS**: Use Material UI theme system; avoid inline styles

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` for new features
- `fix:` for bug fixes
- `security:` for security improvements
- `docs:` for documentation changes
- `chore:` for maintenance tasks
- `refactor:` for code restructuring

### Security Guidelines
- **Never** commit credentials, API keys, or secrets
- Use environment variables for all configuration
- Validate and sanitize all user input
- Use prepared statements for all database queries
- Follow the principle of least privilege for database users

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with clear, descriptive commits
3. Test your changes locally
4. Submit a PR with a clear description of what and why
5. Address any review feedback

## Reporting Issues

Use [GitHub Issues](https://github.com/shemaarafati2020/SkillArc-Learning-Management-System/issues) to report bugs or request features. Please include:
- A clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots if applicable

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
