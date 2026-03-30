FROM alpine
# install python3
RUN apk add python3
# create venv
ADD . /app
RUN python3 -m venv /app
# install dependencies
RUN sh -c ". /app/bin/activate ; pip3 install -r /app/requirements.txt"
# start command
CMD ["sh", "-c", "source /app/bin/activate ; cd /app ; exec uvicorn app.main:app --reload"]
