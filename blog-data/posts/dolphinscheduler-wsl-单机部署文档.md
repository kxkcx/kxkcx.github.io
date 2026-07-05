## 1. 部署规划

部署环境：

```
系统环境：WSL Ubuntu
部署模式：单机模式
部署用户：hadoop
本机地址：192.168.8.22
安装目录：/home/hadoop/env
脚本目录：/home/hadoop/scripts
```

组件规划：

```
JDK：/home/hadoop/env/java
Hadoop：/home/hadoop/env/hadoop
ZooKeeper：/home/hadoop/env/zookeeper
DolphinScheduler：/home/hadoop/env/dolphinscheduler
```

MySQL 信息：

```
MySQL 地址：192.168.8.22:3306
数据库名：dolphinscheduler
账号：hadoop
密码：hadoop
```

DolphinScheduler 访问地址：

```
http://192.168.8.22:12345/dolphinscheduler/ui
```

默认账号：

```
admin / dolphinscheduler123
```

## 2. 创建基础目录

```
mkdir -p /home/hadoop/env
mkdir -p /home/hadoop/scripts/start
mkdir -p /home/hadoop/scripts/stop
mkdir -p /home/hadoop/scripts/restart
mkdir -p /home/hadoop/scripts/status
```

## 3. 安装 JDK 8

DolphinScheduler、Hadoop、ZooKeeper 建议统一使用 JDK 8。

```
cd /home/hadoop/env

wget -O jdk8.tar.gz https://github.com/adoptium/temurin8-binaries/releases/download/jdk8u412-b08/OpenJDK8U-jdk_x64_linux_hotspot_8u412b08.tar.gz

tar -zxvf jdk8.tar.gz
mv jdk8u412-b08 java
```

配置环境变量：

```
vim ~/.bashrc
```

追加：

```
export JAVA_HOME=/home/hadoop/env/java
export PATH=$JAVA_HOME/bin:$PATH
```

生效：

```
source ~/.bashrc
java -version
```

## 4. 安装 HDFS

### 4.1 下载 Hadoop

```
cd /home/hadoop/env

wget https://archive.apache.org/dist/hadoop/common/hadoop-3.3.6/hadoop-3.3.6.tar.gz
tar -zxvf hadoop-3.3.6.tar.gz
mv hadoop-3.3.6 hadoop
```

配置环境变量：

```
vim ~/.bashrc
```

追加：

```
export HADOOP_HOME=/home/hadoop/env/hadoop
export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
export PATH=$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$PATH
```

生效：

```
source ~/.bashrc
```

### 4.2 配置 Hadoop

编辑：

```
vim /home/hadoop/env/hadoop/etc/hadoop/hadoop-env.sh
```

设置：

```
export JAVA_HOME=/home/hadoop/env/java
```

编辑 `core-site.xml`：

```
vim /home/hadoop/env/hadoop/etc/hadoop/core-site.xml
```

内容：

```
<configuration>
  <property>
    <name>fs.defaultFS</name>
    <value>hdfs://192.168.8.22:8020</value>
  </property>
</configuration>
```

编辑 `hdfs-site.xml`：

```
vim /home/hadoop/env/hadoop/etc/hadoop/hdfs-site.xml
```

内容：

```
<configuration>
  <property>
    <name>dfs.replication</name>
    <value>1</value>
  </property>

  <property>
    <name>dfs.namenode.name.dir</name>
    <value>file:/home/hadoop/data/hadoop/name</value>
  </property>

  <property>
    <name>dfs.datanode.data.dir</name>
    <value>file:/home/hadoop/data/hadoop/data</value>
  </property>
</configuration>
```

初始化：

```
mkdir -p /home/hadoop/data/hadoop/name
mkdir -p /home/hadoop/data/hadoop/data

hdfs namenode -format
```

### 4.3 HDFS 管理脚本

启动脚本：

```
vim /home/hadoop/scripts/start/start-hdfs.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
export HADOOP_HOME=/home/hadoop/env/hadoop
export PATH=$JAVA_HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$PATH

$HADOOP_HOME/sbin/start-dfs.sh
```

停止脚本：

```
vim /home/hadoop/scripts/stop/stop-hdfs.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
export HADOOP_HOME=/home/hadoop/env/hadoop
export PATH=$JAVA_HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$PATH

$HADOOP_HOME/sbin/stop-dfs.sh
```

状态脚本：

```
vim /home/hadoop/scripts/status/status-hdfs.sh
```

```
#!/bin/bash
jps | grep -E "NameNode|DataNode|SecondaryNameNode"
hdfs dfsadmin -report | head -40
```

重启脚本：

```
vim /home/hadoop/scripts/restart/restart-hdfs.sh
```

```
#!/bin/bash
bash /home/hadoop/scripts/stop/stop-hdfs.sh
sleep 3
bash /home/hadoop/scripts/start/start-hdfs.sh
```

授权：

```
chmod +x /home/hadoop/scripts/start/start-hdfs.sh
chmod +x /home/hadoop/scripts/stop/stop-hdfs.sh
chmod +x /home/hadoop/scripts/status/status-hdfs.sh
chmod +x /home/hadoop/scripts/restart/restart-hdfs.sh
```

## 5. 安装 ZooKeeper

### 5.1 下载 ZooKeeper

```
cd /home/hadoop/env

wget https://archive.apache.org/dist/zookeeper/zookeeper-3.7.1/apache-zookeeper-3.7.1-bin.tar.gz
tar -zxvf apache-zookeeper-3.7.1-bin.tar.gz
mv apache-zookeeper-3.7.1-bin zookeeper
```

配置：

```
cd /home/hadoop/env/zookeeper/conf
cp zoo_sample.cfg zoo.cfg
vim zoo.cfg
```

修改：

```
tickTime=2000
initLimit=10
syncLimit=5
dataDir=/home/hadoop/data/zookeeper
clientPort=2181
```

创建目录：

```
mkdir -p /home/hadoop/data/zookeeper
```

配置环境变量：

```
vim ~/.bashrc
```

追加：

```
export ZOOKEEPER_HOME=/home/hadoop/env/zookeeper
export PATH=$ZOOKEEPER_HOME/bin:$PATH
```

生效：

```
source ~/.bashrc
```

### 5.2 ZooKeeper 管理脚本

启动脚本：

```
vim /home/hadoop/scripts/start/start-zk.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
export ZOOKEEPER_HOME=/home/hadoop/env/zookeeper
export PATH=$JAVA_HOME/bin:$ZOOKEEPER_HOME/bin:$PATH

$ZOOKEEPER_HOME/bin/zkServer.sh start
```

停止脚本：

```
vim /home/hadoop/scripts/stop/stop-zk.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
export ZOOKEEPER_HOME=/home/hadoop/env/zookeeper
export PATH=$JAVA_HOME/bin:$ZOOKEEPER_HOME/bin:$PATH

$ZOOKEEPER_HOME/bin/zkServer.sh stop
```

状态脚本：

```
vim /home/hadoop/scripts/status/status-zk.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
export ZOOKEEPER_HOME=/home/hadoop/env/zookeeper
export PATH=$JAVA_HOME/bin:$ZOOKEEPER_HOME/bin:$PATH

$ZOOKEEPER_HOME/bin/zkServer.sh status
jps | grep QuorumPeerMain
```

重启脚本：

```
vim /home/hadoop/scripts/restart/restart-zk.sh
```

```
#!/bin/bash
bash /home/hadoop/scripts/stop/stop-zk.sh
sleep 3
bash /home/hadoop/scripts/start/start-zk.sh
```

授权：

```
chmod +x /home/hadoop/scripts/start/start-zk.sh
chmod +x /home/hadoop/scripts/stop/stop-zk.sh
chmod +x /home/hadoop/scripts/status/status-zk.sh
chmod +x /home/hadoop/scripts/restart/restart-zk.sh
```

## 6. 安装 DolphinScheduler

### 6.1 下载并解压

```
cd /home/hadoop/env

wget https://archive.apache.org/dist/dolphinscheduler/3.2.0/apache-dolphinscheduler-3.2.0-bin.tar.gz
tar -zxvf apache-dolphinscheduler-3.2.0-bin.tar.gz
mv apache-dolphinscheduler-3.2.0-bin dolphinscheduler
```

### 6.2 下载 MySQL 驱动

```
cd /home/hadoop/env

wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.16/mysql-connector-java-8.0.16.jar

cp mysql-connector-java-8.0.16.jar /home/hadoop/env/dolphinscheduler/lib/
```

### 6.3 初始化 MySQL

```
mysql -h 192.168.8.22 -P 3306 -uroot -p
```

执行：

```
CREATE DATABASE IF NOT EXISTS dolphinscheduler
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

CREATE USER IF NOT EXISTS 'hadoop'@'%' IDENTIFIED BY 'hadoop';
GRANT ALL PRIVILEGES ON dolphinscheduler.* TO 'hadoop'@'%';

CREATE USER IF NOT EXISTS 'hadoop'@'localhost' IDENTIFIED BY 'hadoop';
GRANT ALL PRIVILEGES ON dolphinscheduler.* TO 'hadoop'@'localhost';

FLUSH PRIVILEGES;
```

### 6.4 修改 DolphinScheduler 配置

编辑安装配置：

```
vim /home/hadoop/env/dolphinscheduler/conf/config/install_config.conf
```

核心配置：

```
ips="localhost"
sshPort="22"

masters="localhost"
workers="localhost:default"
alertServer="localhost"
apiServers="localhost"
pythonGatewayServers="localhost"

installPath="/home/hadoop/env/dolphinscheduler"
deployUser="hadoop"
dataBasedirPath="/tmp/dolphinscheduler"

javaHome="/home/hadoop/env/java"
apiServerPort="12345"

DATABASE_TYPE=${DATABASE_TYPE:-"mysql"}
SPRING_DATASOURCE_URL=${SPRING_DATASOURCE_URL:-"jdbc:mysql://192.168.8.22:3306/dolphinscheduler?useUnicode=true&useSSL=false&characterEncoding=UTF-8&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai"}
SPRING_DATASOURCE_USERNAME=${SPRING_DATASOURCE_USERNAME:-"hadoop"}
SPRING_DATASOURCE_PASSWORD=${SPRING_DATASOURCE_PASSWORD:-"hadoop"}

registryPluginName="zookeeper"
registryServers="192.168.8.22:2181"
registryNamespace="dolphinscheduler"

resourceStorageType="HDFS"
resourceUploadPath="/dolphinscheduler"
defaultFS="hdfs://192.168.8.22:8020"
hdfsRootUser="hadoop"

sudoEnable="true"
workerTenantAutoCreate="false"
```

编辑注册中心配置：

```
vim /home/hadoop/env/dolphinscheduler/conf/registry.properties
```

修改为：

```
registry.plugin.name=zookeeper
registry.servers=192.168.8.22:2181
registry.namespace=dolphinscheduler
registry.base.sleep.time.ms=60
registry.max.sleep.ms=300
registry.max.retries=5
registry.session.timeout.ms=30000
registry.connection.timeout.ms=7500
registry.block.until.connected.wait=600
registry.digest=
```

编辑 API 端口：

```
vim /home/hadoop/env/dolphinscheduler/conf/application-api.properties
```

修改为：

```
server.port=12345
```

编辑环境变量：

```
vim /home/hadoop/env/dolphinscheduler/conf/env/dolphinscheduler_env.sh
```

参考配置：

```
export JAVA_HOME=/home/hadoop/env/java
export HADOOP_HOME=/home/hadoop/env/hadoop
export HADOOP_CONF_DIR=/home/hadoop/env/hadoop/etc/hadoop
export ZOOKEEPER_HOME=/home/hadoop/env/zookeeper

export PATH=$JAVA_HOME/bin:$HADOOP_HOME/bin:$HADOOP_HOME/sbin:$ZOOKEEPER_HOME/bin:$PATH
```

建议把脚本头改成 bash：

```
vim /home/hadoop/env/dolphinscheduler/bin/dolphinscheduler-daemon.sh
```

第一行改为：

```
#!/bin/bash
```

### 6.5 初始化 DolphinScheduler 数据库

先启动 ZooKeeper 和 HDFS：

```
bash /home/hadoop/scripts/start/start-zk.sh
bash /home/hadoop/scripts/start/start-hdfs.sh
```

创建 HDFS 资源目录：

```
hdfs dfs -mkdir -p /dolphinscheduler
hdfs dfs -chown -R hadoop:hadoop /dolphinscheduler
```

初始化数据库：

```
cd /home/hadoop/env/dolphinscheduler

bash script/create-dolphinscheduler.sh
```

检查：

```
mysql -h 192.168.8.22 -P 3306 -uhadoop -phadoop dolphinscheduler
```

```
SHOW TABLES LIKE 't_ds_%';
SELECT id, user_name, state FROM t_ds_user;
```

## 7. DolphinScheduler 管理脚本

启动脚本：

```
vim /home/hadoop/scripts/start/start-dolphin.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
cd /home/hadoop/env/dolphinscheduler

bash bin/dolphinscheduler-daemon.sh start master-server
sleep 3
bash bin/dolphinscheduler-daemon.sh start worker-server
sleep 3
bash bin/dolphinscheduler-daemon.sh start logger-server
sleep 3
bash bin/dolphinscheduler-daemon.sh start alert-server
sleep 3
bash bin/dolphinscheduler-daemon.sh start api-server
```

停止脚本：

```
vim /home/hadoop/scripts/stop/stop-dolphin.sh
```

```
#!/bin/bash
export JAVA_HOME=/home/hadoop/env/java
cd /home/hadoop/env/dolphinscheduler

bash bin/dolphinscheduler-daemon.sh stop api-server
bash bin/dolphinscheduler-daemon.sh stop alert-server
bash bin/dolphinscheduler-daemon.sh stop logger-server
bash bin/dolphinscheduler-daemon.sh stop worker-server
bash bin/dolphinscheduler-daemon.sh stop master-server
```

状态脚本：

```
vim /home/hadoop/scripts/status/status-dolphin.sh
```

```
#!/bin/bash
jps | grep -E "MasterServer|WorkerServer|LoggerServer|AlertServer|ApiApplicationServer"

echo "API port:"
netstat -tunlp 2>/dev/null | grep 12345 || ss -lntp | grep 12345
```

重启脚本：

```
vim /home/hadoop/scripts/restart/restart-dolphin.sh
```

```
#!/bin/bash
bash /home/hadoop/scripts/stop/stop-dolphin.sh
sleep 5
bash /home/hadoop/scripts/start/start-dolphin.sh
```

授权：

```
chmod +x /home/hadoop/scripts/start/start-dolphin.sh
chmod +x /home/hadoop/scripts/stop/stop-dolphin.sh
chmod +x /home/hadoop/scripts/status/status-dolphin.sh
chmod +x /home/hadoop/scripts/restart/restart-dolphin.sh
```

## 8. 全部组件统一脚本

启动全部：

```
vim /home/hadoop/scripts/start/start-all.sh
```

```
#!/bin/bash
bash /home/hadoop/scripts/start/start-zk.sh
sleep 3
bash /home/hadoop/scripts/start/start-hdfs.sh
sleep 5
bash /home/hadoop/scripts/start/start-dolphin.sh
```

停止全部：

```
vim /home/hadoop/scripts/stop/stop-all.sh
```

```
#!/bin/bash
bash /home/hadoop/scripts/stop/stop-dolphin.sh
sleep 3
bash /home/hadoop/scripts/stop/stop-hdfs.sh
sleep 3
bash /home/hadoop/scripts/stop/stop-zk.sh
```

状态全部：

```
vim /home/hadoop/scripts/status/status-all.sh
```

```
#!/bin/bash
echo "===== ZooKeeper ====="
bash /home/hadoop/scripts/status/status-zk.sh

echo "===== HDFS ====="
bash /home/hadoop/scripts/status/status-hdfs.sh

echo "===== DolphinScheduler ====="
bash /home/hadoop/scripts/status/status-dolphin.sh
```

重启全部：

```
vim /home/hadoop/scripts/restart/restart-all.sh
```

```
#!/bin/bash
bash /home/hadoop/scripts/stop/stop-all.sh
sleep 5
bash /home/hadoop/scripts/start/start-all.sh
```

授权：

```
chmod +x /home/hadoop/scripts/start/start-all.sh
chmod +x /home/hadoop/scripts/stop/stop-all.sh
chmod +x /home/hadoop/scripts/status/status-all.sh
chmod +x /home/hadoop/scripts/restart/restart-all.sh
```

## 9. 启动验证

启动全部：

```
bash /home/hadoop/scripts/start/start-all.sh
```

查看状态：

```
bash /home/hadoop/scripts/status/status-all.sh
```

查看 Java 进程：

```
jps
```

正常应包含：

```
NameNode
DataNode
SecondaryNameNode
QuorumPeerMain
MasterServer
WorkerServer
LoggerServer
AlertServer
ApiApplicationServer
```

检查 API 端口：

```
telnet localhost 12345
```

或：

```
curl -I http://localhost:12345/dolphinscheduler/ui
```

浏览器访问：

```
http://192.168.8.22:12345/dolphinscheduler/ui
```

默认登录：

```
admin / dolphinscheduler123
```

## 10. 常见问题

### 10.1 脚本报 source not found

原因是脚本被 `sh/dash` 执行。统一使用 `bash`：

```
bash bin/dolphinscheduler-daemon.sh start api-server
```

或者修改脚本第一行：

```
#!/bin/bash
```

### 10.2 Master 报 No such registry plugin

检查：

```
cat /home/hadoop/env/dolphinscheduler/conf/registry.properties
```

必须配置：

```
registry.plugin.name=zookeeper
registry.servers=192.168.8.22:2181
registry.namespace=dolphinscheduler
```

### 10.3 API 启动失败，8080 被占用

检查：

```
cat /home/hadoop/env/dolphinscheduler/conf/application-api.properties
```

必须配置：

```
server.port=12345
```

### 10.4 登录失败

先检查数据库是否初始化：

```
SHOW TABLES LIKE 't_ds_%';
SELECT id, user_name, state FROM t_ds_user;
```

如果没有 `t_ds_` 表，重新执行：

```
cd /home/hadoop/env/dolphinscheduler
bash script/create-dolphinscheduler.sh
```

### 10.5 访问地址打不开

确认服务端口：

```
netstat -tunlp | grep 12345
```

确认访问的是服务器地址：

```
http://192.168.8.22:12345/dolphinscheduler/ui
```
