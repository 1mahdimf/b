yum install git

yum install epel-release yum-utils
yum install http://rpms.remirepo.net/enterprise/remi-release-7.rpm
yum-config-manager --enable remi
yum install redis
systemctl start redis

yum install nano

curl -sL https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum install -y nodejs

mkdir ~/.ssh
nano ~/.ssh/config
Host \*
ClientAliveInterval 5m # 5 minutes
ClientAliveCountMax 2 # 2 times

nano /etc/ssh/ssh_config
AT THE END FILE :
ClientAliveInterval 5m # 5 minutes
ClientAliveCountMax 2 # 2 times

service sshd restart

ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDNZ3fb+iih8jFxkgQH3TKN/5x1y/hOHUm+B92z0/R2iCqSUrPPboz9oPfz54RRMDGQhbVFKOkZup6ujMda9nVdnZeB5tny8JpScmxIyC69YjeTFqTQEqWETDyhe9k7XyO7OeWujkH9y50JUKx5za55vEMuCxDSEda/w0wK3fzhT2+AKT5gEqKKclHV3q6e3mGe2yeXx1V4rQJwT4A1ILfDGD9fVBFYkbeaCokSqDrHORCRo7HtFIpFRphmL70mw35AURSmXWfRTfWOWlUqIYR1Uc0C0wRjFV6c1tqwSHrn5pufWsiF+W23faJ95lR9xQlI5IaENzdU7ang3wOcG7It

ON PC : ssh-keygen
/home/mjm/.ssh/mjmir8
cat /home/mjm/.ssh/mjmir8.pub

nano .ssh/authorized_keys

sudo timedatectl set-timezone Asia/Tehran
OR
sudo rm -rf /etc/localtime
sudo ln -s /usr/share/zoneinfo/Asia/Tehran /etc/localtime


systemctl status redis

firewall-cmd --zone=public --permanent --add-port=3000/tcp
firewall-cmd --reload

============================

npm i -g pm2

npm i -g yarn
sudo yum install yarn

mkdir projects
cd projects/
git clone https://2012mjm:mjm6241042@github.com/2012mjm/bsr.git
mv bsr/ bors
cd bors
git checkout -b develop origin/develop
git checkout -b feature/feature-full-bot origin/feature/feature-full-bot
yarn | npm i

pm2 start ~root/projects/bors/api.js --name bors-api --log ~root/projects/bors/logs/api
pm2 save
pm2 startup
pm2 save

==========================

> yum-config-manager --add-repo https://download.opensuse.org/repositories/home:/Alexander_Pozdnyakov/CentOS_7/
> sudo rpm --import https://build.opensuse.org/projects/home:Alexander_Pozdnyakov/public_key
> yum update
> yum install tesseract

> yum install ImageMagick ImageMagick-devel

=======================

nano ~/.bash_profile
cd ~/projects/bors-new
