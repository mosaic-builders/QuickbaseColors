# Start with an AWS provided image that is ready to use with Lambda
FROM amazon/aws-lambda-nodejs:12

# Allow AWS credentials to be supplied when building this container locally for testing,
# so S3 can be accessed
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_REGION=us-east-1

# Install Chrome to get all of the dependencies installed
RUN yum install -y amazon-linux-extras
RUN amazon-linux-extras install epel -y
RUN yum install -y chromium


ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
    AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
    AWS_REGION=$AWS_REGION


RUN npm install -g yarn

COPY package.json yarn.lock ${LAMBDA_TASK_ROOT}/
RUN yarn

COPY quickbase-colors.js screenshot.js config.js .env ${LAMBDA_TASK_ROOT}/

# Lambda handler path
CMD [ "screenshot.run" ]