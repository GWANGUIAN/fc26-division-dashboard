FROM public.ecr.aws/lambda/nodejs:22 AS build
WORKDIR ${LAMBDA_TASK_ROOT}
COPY package.json ./
RUN npm install --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build:lambda

FROM public.ecr.aws/lambda/nodejs:22
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=build ${LAMBDA_TASK_ROOT}/node_modules ./node_modules
COPY --from=build ${LAMBDA_TASK_ROOT}/dist/lambda ./
CMD ["scraper.handler"]
