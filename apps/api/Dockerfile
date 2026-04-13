# Stage 1: Build Stage
FROM node:22 AS build

WORKDIR /src

# Copy package.json and install dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production Stage (AWS Lambda Compatible)
FROM public.ecr.aws/lambda/nodejs:18

WORKDIR /var/task

# Copy only necessary files from build stage
COPY --from=build /src/dist dist
COPY --from=build /src/node_modules node_modules
COPY package.json . 

# Set AWS Lambda entry point
CMD ["dist/lambda.handler"]
