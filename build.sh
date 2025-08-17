#!/bin/bash
echo "----- Forcing Python 3.10 -----"
pyenv install 3.10.13 -s
pyenv global 3.10.13
python --version

echo "----- Installing dependencies -----"
pip install --upgrade pip
pip install -r requirements.txt