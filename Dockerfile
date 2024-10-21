# Базовий образ Jenkins
FROM jenkins/jenkins:lts

# Переключаємось на користувача root
USER root

# Оновлюємо пакети та встановлюємо необхідні інструменти
RUN apt-get update && apt-get install -y \
    rpm \
    dpkg-dev \
    sudo

# Додаємо користувача Jenkins у групу sudo
RUN echo "jenkins ALL=NOPASSWD: ALL" >> /etc/sudoers

# Повертаємося до користувача Jenkins
USER jenkins
