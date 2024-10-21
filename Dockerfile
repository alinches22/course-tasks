FROM jenkins/jenkins:lts

USER root
RUN apt-get update && apt-get install -y rpm dpkg-dev docker.io

RUN groupadd -g 999 docker
RUN usermod -aG docker jenkins
