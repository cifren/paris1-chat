FROM codenvy/node

#RUN UPDATE
RUN sudo apt-get update && \
    sudo apt-get install -y \
        libldap2-dev \
        mongodb

# INSTALL PYTHON
ENV INSTALL_FOLDER="/home/user"
RUN sudo apt-get install -y \
    build-essential \
    libbz2-dev \
    libdb-dev \
    libgdbm-dev \
    libncurses5-dev \
    libreadline-gplv2-dev \
    libsqlite3-dev \
    libssl-dev \
    zlib1g-dev

RUN cd $INSTALL_FOLDER && \
    wget http://www.python.org/ftp/python/2.7.3/Python-2.7.3.tgz && \
    tar -xzf Python-2.7.3.tgz

RUN cd $INSTALL_FOLDER/Python-2.7.3 && \
    ./configure --prefix=/usr --enable-shared && \
    make && \
    sudo make install

RUN cd $INSTALL_FOLDER  && \
    rm -rf  Python-2.7.3 Python-2.7.3.tgz

RUN sudo update-alternatives --install /usr/bin/python python /usr/bin/python2.7 10

#DOWNGRADE NPM
RUN sudo npm install npm@2 -g

# CLEAN AND REMOVE APT-GET FILES
RUN sudo apt-get clean && \
    sudo apt-get -y autoremove && \
    sudo apt-get -y clean && \
    sudo rm -rf /var/lib/apt/lists/*

# END SCRIPT
CMD tail -f /dev/null
