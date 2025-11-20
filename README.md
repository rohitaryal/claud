# claud - A cloud based file storage

We are building a remote file storage system `claud` (_/klɔːd/_) kind of like Google Drive alternative but with bunch of cool stuffs.

## 🐳 Quick Start with Docker

The easiest way to run the entire application is using Docker:

```bash
# Start all services (frontend, backend, and database) 
docker compose up -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/api/health

For detailed Docker setup documentation, see [README.docker.md](README.docker.md).

To verify your Docker setup is working correctly, run:
```bash
./verify-docker.sh
```

### Members

1. Rohit Sharma
2. Prajwal Jha
3. Aniket Sah
4. Pradeep Kumar Kohar
5. Awadesh Gupta Kaulapuri
6. Nagendra Thakur

Soon everyone will be assigned their role with the project structure to follow in [INSTRUCTIONS.md](/INSTRUCTIONS.md). While we wait, lets read the rules and guidelines below.

### Repo structure

1. Root files in repo should be
    - `/frontend` -> Contains react code
    - `/backend` -> Contains nodejs/bun (hono) code
    - Utility scripts
    - Repository related assets, `README.md`, etc.

### How to contribute?

I hope you understand Git basics: `add`, `commit`, `push`, `pull`, `rebase`, if not then try [learngitbranching.js.org](https://learngitbranching.js.org/), you will be ready in less than `2` days.
I hope you take git seriously because this will be our very foundation to build this project as a team.

1. Clone the repo
    ```bash
    git clone https://github.com/rohitaryal/claud/
    cd claud/
    ```
2. Create branch with **your name**
    ```bash
    git checkout -b rohitaryal # replace with your name
    ```
3. Now write your code in this branch and be ready for commit.
    ```bash
    git add <edited_file_path>
    git commit -m "What changes you made in the code"
    git push origin rohitaryal # replace with branchname you used above
    ```

> [!TIP]
> Please read [COMMIT GUIDELINES](#commit-guidelines) to learn how to make good commits.

4. If everything is fine, your contributions will be merged into `main` branch

### Commit Guidelines

A good commit helps everyone including you to understand where the project is going, how people including yourself are building the project,
what changes have been made recently and what feature did the guy `x` made which caused the whole project to fail?

So it is very important to follow some soft rules before you commit something. You can follow these simple rules:

1. Make your commit messages are very descriptive.
    - It doesn't need to be a 10 page essay.
    - Think it like those `very short questions` but this time the question is: `What changes did you make?`
2. Only make commit after a feature is completely implemented
    - Do: You added a sign-up page with everything from header to footer -> Make a commit
    - Do: You optimized a function in commited code -> Make another commit
    - Do: You caught some typo in your commited code -> Make another commit
    - Do not: You added a feature but its buggy/wrong -> Make a commit
    - Do not: You add a input box -> Make a commit, You add a link -> Make a commit, You wrote some code -> Make a commit because: You are going to khaogali with your room-mate.
    - Do not: You added asset for password icon -> Make a commit, You added asset for email icon -> Make a commit
3. Please append these words to your commit messages so the log viewer knows what kind of change was it.
    1. `feat` - Abbr. for feature. Used when a commit adds a feature. Example:
        ```bash
        git commit -m "feat: Added sign-up page"
        ```
    2. `fix` - Used when a commit fixes something. Example:
        ```bash
        git commit -m "fix: fix infinite redirect problem"
        ```
    3. `docs` - Used when you made a change in documentation, or comment used as documentation.
        ```bash
        git commit -m "docs: Added documentation for sign-up function"
        ```
    4. `refactor` - Changes like: Renaming variables, changes that don't make change in actual working
        ```bash
        git commit -m "refactor: change username variable from name to username"
        ```
    5. `test` - Addition, changes in testing code
        ```bash
        git commit -m "test: add test for xss on forms"
        ```
4. Don't do anything that will make you loose your code like:
    - `push --force`
    - Changing branch without commiting
5. Take AI help in case you are completely lost

### Wait before you provide your task to AI

1. Remind yourself that you are not actively learning this way
2. This repository is for learning problem solving in team
3. If you are completely stuck try asking for help among members, still helpless? You can take help of AI
4. Make sure you are completely understanding the generated code and you take responsibility for the code you push
5. In-case you are lost with AI generated code, it's your responsibility to fix it because the code wasn't from us
6. Assigned teacher may ask specific thing from your code and it remains your responsibility to explain to them
7. Use AI as a tool, not as your magical assignment solver.

### Everything else not mentioned above

1. We have like `20` days to finish this project(from: Oct 9) (assumption)
2. Please take this project seriously

Thanks!
