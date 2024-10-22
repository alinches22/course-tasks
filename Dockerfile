FROM jenkins/jenkins:lts

USER root
RUN apt-get update && apt-get install -y rpm devscripts build-essential


USER jenkins
