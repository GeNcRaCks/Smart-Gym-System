# Deployment Guide: Smart Gym System to Vercel

This guide walks you through deploying your Next.js application and setting up a production PostgreSQL database using Vercel.

## 1. Prepare Your Repository

1. Make sure all recent changes are committed to your Git repository:
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment and PostgreSQL"
   git push origin main
   ```

## 2. Deploy Web App to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New** -> **Project**.
3. Import the `Smart-Gym-System` repository from GitHub.
4. **Do not click Deploy just yet!** We need to set up the database and environment variables first.

## 3. Set Up Vercel Postgres

1. In your Vercel project setup screen (before deploying), look for the **Storage** tab or skip deployment and go to the project dashboard.
2. Click on **Storage** in the Vercel dashboard.
3. Select **Postgres** and click **Create Database**.
4. Accept the default region and create the database.
5. Vercel will automatically add the required environment variables (like `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`) to your project!

## 4. Map Environment Variables

Because our Prisma schema looks for `DATABASE_URL` and `DIRECT_URL`, we need to map Vercel's variables to ours.
1. Go to your project's **Settings** -> **Environment Variables**.
2. Add the following variables. *For the values, copy them from the `.env.local` tab in your Vercel Postgres Storage settings, or reference Vercel's variables:*
   - Key: `DATABASE_URL`
     - Value: Copy the value of `POSTGRES_PRISMA_URL` (this uses the connection pooler).
   - Key: `DIRECT_URL`
     - Value: Copy the value of `POSTGRES_URL_NON_POOLING` (this is used for running migrations).

## 5. Add Other Required Environment Variables

You also need to add all your app's environment variables to the Vercel **Settings -> Environment Variables** section:

*   `JWT_SECRET`: `super-secret-key-change-me` (Please change this to a secure random string for production!)
*   `SMTP_HOST`: `smtp.office365.com`
*   `SMTP_PORT`: `587`
*   `SMTP_SECURE`: `false`
*   `SMTP_USER`: `smartreps1@hotmail.com`
*   `SMTP_PASS`: `Smartgym@1234`
*   `SMTP_TEST_RECIPIENT`: `smartreps1@hotmail.com`

## 6. Deploy and Migrate

1. Go to the **Deployments** tab and click **Redeploy** on your latest commit, OR push a new commit to trigger a build.
2. During the build, Vercel will run our custom script:
   `prisma generate && prisma migrate deploy && next build`
   *Note: Because this is a brand new database, `migrate deploy` will create all the necessary tables.*
3. Wait for the build to finish. It should show a green checkmark ✅.

## 7. Verify Deployment

1. Click on the domain Vercel provides (e.g., `smart-gym-system.vercel.app`).
2. Test the authentication (try logging in or registering a new user).
3. Check if emails are being sent successfully (if your registration process includes email verification).

## Local Development (Optional)

Now that you are using PostgreSQL, you have two choices for local development:
1. **Use Vercel Postgres locally:** Run `vercel link` and `vercel env pull .env.local` in your terminal to download the production database credentials, so your local app connects to the remote DB.
2. **Use Local Postgres:** Install PostgreSQL locally (or via Docker), create a local database, and update your `.env` file's `DATABASE_URL` to point to `postgresql://postgres:password@localhost:5432/smartgym`.
