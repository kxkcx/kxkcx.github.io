# spring的设计理念和整体架构

# spring的核心实现：IOC容器

## 依赖反转

控制反转：思考的是一个对象如何获取它依赖的对象的引用，这里反转指的是责任的反转，是自己new还是框架帮我们构造。


### ioc容器干什么的？

IOC实现了组件之间的解耦，开发人员来维护依赖关系比较麻烦，可以将获取资源的方向反转，让ioc去管理依赖关系，然后将依赖关系注入到组件中。具体的注入方法有接口注入、setter注入（最常见防止注入异常）、构造器注入。


### IOC容器怎么实现的？

BeanFactory和ApplicationContext


所有的Bean由BeanFactory进行管理


用户定义的Bean转成IOC容器中的数据结构这个结构就是BeanDefinition，然后通过BeanDefinitionRegistry注入到HashMap里面。
