FROM node:22

# Firebase CLI 설치
RUN npm install -g firebase-tools

# Emulator Suite용 Java (Realtime DB, Functions 등)
RUN apt-get update && apt-get install -y openjdk-17-jre-headless && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# Emulator가 0.0.0.0에서 Listen하여 호스트 브라우저 접속 허용
ENV FIREBASE_EMULATOR_HOST=0.0.0.0

EXPOSE 4000 5001 9000 9099

CMD ["bash"]
