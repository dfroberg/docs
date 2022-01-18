
# Introduction
This is a brief on how to get Gitlab (omnibus) DevOps pipelines working on a local on prem Kubernetes (k3s) cluster by enabling MetalLB as a LoadBalancer infront of your ingress controllers.

## Scenario
* You have a main router with one routable external IP address, how do you expose services on it?

# Installing K3S

**Alternative 1:**
I suggest you take a look at the k3sup project (https://github.com/alexellis/k3sup) to do this.
Run this on your local workstation;

```bash
	curl -sLS https://get.k3sup.dev | sh
```

```bash
	sudo install k3sup /usr/local/bin/
```
```bash
	k3sup --help
```

Say you have an Ubuntu box on your network with IP 192.168.3.38 that you wish to create the cluster on. Run this on your workstation;
```bash
export IP=192.168.3.38
k3sup install --ip $IP --user ubuntu --k3s-extra-args '--no-deploy servicelb --no-deploy traefik'
```
**Alternative 2:**
Or if you are already in a terminal on the target machine, run this:
```bash
	export INSTALL_K3S="server --node-ip=192.168.3.38 --flannel-backend wireguard"
	export INSTALL_K3S_EXEC="--no-deploy servicelb --no-deploy traefik"
	curl -sfL https://get.k3s.io | sh -
```
Your should get something like this;
```
    [INFO]  Finding release for channel stable
    [INFO]  Using v1.18.8+k3s1 as release
    [INFO]  Downloading hash https://github.com/rancher/k3s/releases/download/v1.18.8+k3s1/sha256sum-amd64.txt
    [INFO]  Downloading binary https://github.com/rancher/k3s/releases/download/v1.18.8+k3s1/k3s
    [INFO]  Verifying binary download
    [INFO]  Installing k3s to /usr/local/bin/k3s
    [INFO]  Creating /usr/local/bin/kubectl symlink to k3s
    [INFO]  Creating /usr/local/bin/crictl symlink to k3s
    [INFO]  Creating /usr/local/bin/ctr symlink to k3s
    [INFO]  Creating killall script /usr/local/bin/k3s-killall.sh
    [INFO]  Creating uninstall script /usr/local/bin/k3s-uninstall.sh
    [INFO]  env: Creating environment file /etc/systemd/system/k3s.service.env
    [INFO]  systemd: Creating service file /etc/systemd/system/k3s.service
    [INFO]  systemd: Enabling k3s unit
    Created symlink /etc/systemd/system/multi-user.target.wants/k3s.service → /etc/systemd/system/k3s.service.
    [INFO]  systemd: Starting k3s
```
Double check the service:
```
	systemctl status k3s
```
```
    ● k3s.service - Lightweight Kubernetes
         Loaded: loaded (/etc/systemd/system/k3s.service; enabled; vendor preset: enabled)
         Active: active (running) since Wed 2020-09-09 12:29:09 UTC; 1min 45s ago
           Docs: https://k3s.io
        Process: 913881 ExecStartPre=/sbin/modprobe br_netfilter (code=exited, status=0/SUCCESS)
        Process: 913882 ExecStartPre=/sbin/modprobe overlay (code=exited, status=0/SUCCESS)
       Main PID: 913883 (k3s-server)
          Tasks: 64
         Memory: 717.0M
         CGroup: /system.slice/k3s.service
                 ├─913883 /usr/local/bin/k3s server --no-deploy servicelb --no-deploy traefik
                 ├─913975 containerd -c /var/lib/rancher/k3s/agent/etc/containerd/config.toml -a /run/k3s/containerd/containerd.sock --state /run/k3s/containerd --root /var/lib/rancher/k3s/agent/co>
                 ├─914334 /var/lib/rancher/k3s/data/19bb6a9b46ad0013de084cf1e0feb7927ff9e4e06624685ff87f003c208fded1/bin/containerd-shim-runc-v2 -namespace k8s.io -id 0b34b08de433b8dbfcd15bc300d276>
                 ├─914347 /var/lib/rancher/k3s/data/19bb6a9b46ad0013de084cf1e0feb7927ff9e4e06624685ff87f003c208fded1/bin/containerd-shim-runc-v2 -namespace k8s.io -id 7a9b042b2ece97e93bf38c48b9f760>
                 ├─914372 /var/lib/rancher/k3s/data/19bb6a9b46ad0013de084cf1e0feb7927ff9e4e06624685ff87f003c208fded1/bin/containerd-shim-runc-v2 -namespace k8s.io -id 30684736a9c464eda8ec8d218135b3>
                 ├─914420 /pause
                 ├─914428 /pause
                 ├─914436 /pause
                 ├─914525 local-path-provisioner start --config /etc/config/config.json
                 ├─914602 /coredns -conf /etc/coredns/Corefile
                 └─914623 /metrics-server
...
```

If you don't have any other clusters, get the .kube config into a file;
On your cluster node you can run;
~~~
mkdir ~/.kube
~~~
```
	kubectl config view --raw > ~/.kube/config
```
On your workstation you can run;
```bash
	scp -i ~/.ssh/identity root@192.168.3.38:/etc/rancher/k3s/k3s.yaml /root/.kube/config
```
The file contains a localhost endpoint ip 127.0.0.1, we need to replace this by the IP address of the master node instead 192.168.3.38.
```bash
	sed -i '' 's/127\.0\.0\.1/192\.168\.3\.38/g' ~/.kube/config
```  
Test it out;
```
	kubectl get all --all-namespaces
```
```
    NAMESPACE     NAME                                         READY   STATUS    RESTARTS   AGE
    kube-system   pod/local-path-provisioner-6d59f47c7-m5vd9   1/1     Running   0          3m8s
    kube-system   pod/metrics-server-7566d596c8-zdvgw          1/1     Running   0          3m8s
    kube-system   pod/coredns-7944c66d8d-wcdd7                 1/1     Running   0          3m8s

    NAMESPACE     NAME                     TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                  AGE
    default       service/kubernetes       ClusterIP   10.43.0.1     <none>        443/TCP                  3m25s
    kube-system   service/kube-dns         ClusterIP   10.43.0.10    <none>        53/UDP,53/TCP,9153/TCP   3m22s
    kube-system   service/metrics-server   ClusterIP   10.43.32.80   <none>        443/TCP                  3m21s

    NAMESPACE     NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
    kube-system   deployment.apps/local-path-provisioner   1/1     1            1           3m22s
    kube-system   deployment.apps/metrics-server           1/1     1            1           3m21s
    kube-system   deployment.apps/coredns                  1/1     1            1           3m22s

    NAMESPACE     NAME                                               DESIRED   CURRENT   READY   AGE
    kube-system   replicaset.apps/local-path-provisioner-6d59f47c7   1         1         1       3m9s
    kube-system   replicaset.apps/metrics-server-7566d596c8          1         1         1       3m9s
    kube-system   replicaset.apps/coredns-7944c66d8d                 1         1         1       3m9s
```

# Installing MetalLB

Here you specify the address range to want to issue IPs in.
```
	kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.9.3/manifests/namespace.yaml
```
```
  namespace/metallb-system created
```
```
	kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.9.3/manifests/metallb.yaml
```
```
    podsecuritypolicy.policy/controller created
    podsecuritypolicy.policy/speaker created
    serviceaccount/controller created
    serviceaccount/speaker created
    clusterrole.rbac.authorization.k8s.io/metallb-system:controller created
    clusterrole.rbac.authorization.k8s.io/metallb-system:speaker created
    role.rbac.authorization.k8s.io/config-watcher created
    role.rbac.authorization.k8s.io/pod-lister created
    clusterrolebinding.rbac.authorization.k8s.io/metallb-system:controller created
    clusterrolebinding.rbac.authorization.k8s.io/metallb-system:speaker created
    rolebinding.rbac.authorization.k8s.io/config-watcher created
    rolebinding.rbac.authorization.k8s.io/pod-lister created
    daemonset.apps/speaker created
    deployment.apps/controller created
```
**On first install only**
```bash
	kubectl create secret generic -n metallb-system memberlist --from-literal=secretkey="$(openssl rand -base64 128)"
```
```
  	secret/memberlist created
```
Create an config map file:
```
    nano metallb-config.yml
```    
Paste and modify addresses as needed:
```yaml
    apiVersion: v1
    kind: ConfigMap
    metadata:
      namespace: metallb-system
      name: config
    data:
      config: |
        address-pools:
        - name: default
          protocol: layer2
          addresses:
          - 192.168.3.230-192.168.3.250
```
Then apply the values;
```
    kubectl apply -f metallb-config.yml
```
```
    configmap/config created
```

Your system should now look something like this;
```
    kubectl get all --all-namespaces
```
```console
NAMESPACE        NAME                                         READY   STATUS    RESTARTS   AGE
kube-system      pod/local-path-provisioner-6d59f47c7-m5vd9   1/1     Running   0          22m
kube-system      pod/metrics-server-7566d596c8-zdvgw          1/1     Running   0          22m
kube-system      pod/coredns-7944c66d8d-wcdd7                 1/1     Running   0          22m
metallb-system   pod/controller-57f648cb96-zncbs              1/1     Running   0          2m44s
metallb-system   pod/speaker-l7brp                            1/1     Running   0          2m44s

NAMESPACE     NAME                     TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)                  AGE
default       service/kubernetes       ClusterIP   10.43.0.1     <none>        443/TCP                  22m
kube-system   service/kube-dns         ClusterIP   10.43.0.10    <none>        53/UDP,53/TCP,9153/TCP   22m
kube-system   service/metrics-server   ClusterIP   10.43.32.80   <none>        443/TCP                  22m

NAMESPACE        NAME                     DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
metallb-system   daemonset.apps/speaker   1         1         1       1            1           beta.kubernetes.io/os=linux   2m44s

NAMESPACE        NAME                                     READY   UP-TO-DATE   AVAILABLE   AGE
kube-system      deployment.apps/local-path-provisioner   1/1     1            1           22m
kube-system      deployment.apps/metrics-server           1/1     1            1           22m
kube-system      deployment.apps/coredns                  1/1     1            1           22m
metallb-system   deployment.apps/controller               1/1     1            1           2m44s

NAMESPACE        NAME                                               DESIRED   CURRENT   READY   AGE
kube-system      replicaset.apps/local-path-provisioner-6d59f47c7   1         1         1       22m
kube-system      replicaset.apps/metrics-server-7566d596c8          1         1         1       22m
kube-system      replicaset.apps/coredns-7944c66d8d                 1         1         1       22m
metallb-system   replicaset.apps/controller-57f648cb96              1         1         1       2m44s
```

# Configure GitLab
## Prepare
Prepare your cluster for GitLab
```
    nano gitlab-admin-service-account.yaml
```
```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: gitlab-admin
      namespace: kube-system
    ---
    apiVersion: rbac.authorization.k8s.io/v1
    kind: ClusterRoleBinding
    metadata:
      name: gitlab-admin
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: ClusterRole
      name: cluster-admin
    subjects:
      - kind: ServiceAccount
        name: gitlab-admin
        namespace: kube-system
```
```
   	kubectl apply -f gitlab-admin-service-account.yaml
```
```
    serviceaccount/gitlab-admin created
    clusterrolebinding.rbac.authorization.k8s.io/gitlab-admin created
```
Now we need to get some information;

We need the service token;
```bash
	kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep gitlab-admin | awk '{print $1}')
```
Will give your something like this;
```
    Name:         gitlab-admin-token-9jrc9
    Namespace:    kube-system
    Labels:       <none>
    Annotations:  kubernetes.io/service-account.name: gitlab-admin
                  kubernetes.io/service-account.uid: 45706970-21ae-499c-83fa-9995a340a5e8

    Type:  kubernetes.io/service-account-token

    Data
    ====
    ca.crt:     526 bytes
    namespace:  11 bytes
    token:      eyJhbGciOiJSUzI1NiIsImtpZCI6ImNNRFgyblhHWDZvZWt2LXJTVnU5cjZTd3pvOV81UWEtRFZaN2tmV0JMV2cifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJnaXRsYWItYWRtaW4tdG9rZW4tOWpyYzkiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC5uYW1lIjoiZ2l0bGFiLWFkbWluIiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQudWlkIjoiNDU3MDY5NzAtMjFhZS00OTljLTgzZmEtOTk5NWEzNDBhNWU4Iiwic3ViIjoic3lzdGVtOnNlcnZpY2VhY2NvdW50Omt1YmUtc3lzdGVtOmdpdGxhYi1hZG1pbiJ9.PlbHkEfZEV76IPY8Dzjye2TteX23sdglR2ymp0rRiDimEcQtf76IZa26jYBVZSbLc_GtMeLo6L5AMLb8hnvqLQdPc7o-yLqfhT2Snwg5q44dF7PtHlHCwvjdq18FiTOV3AgqH-_TJHRVTwVAhWLBWAapFUdNVFV1agp_6gLqZPRjJ1DmSEnT0qGfg-6fR9iXY_CQnYkzvoi0oOvEjUnH57_GbiThGxgiMNHr1vPEo51pApI9KIRXdfrO_iQZxmOquNZ-0B9MFXcdB54SrVHOosifKkjh69HxR3SMX84Z6SvayrXzMu0DqJ9fkAQ63jHXBzGEk9w-CFvPtTrYM7diLQ
```  
Kepp a note of the token listed, we will need it later.

Now we need the k3s certificate;
~~~
cat /etc/rancher/k3s/k3s.yaml | grep certificate-authority-data: | awk '{print $2}' | base64 -d
~~~

This will give your this;
```
-----BEGIN CERTIFICATE-----
MIIBVzCB/qADAgECAgEAMAoGCCqGSM49BAMCMCMxITAfBgNVBAMMGGszcy1zZXJ2
ZXItY2FAMTU5OTY1NDUzMzAeFw0yMDA5MDkxMjI4NTNaFw0zMDA5MDcxMjI4NTNa
MCMxITAfBgNVBAMMGGszcy1zZXJ2ZXItY2FAMTU5OTY1NDUzMzBZMBMGByqGSM49
AgEGCCqGSM49AwEHA0IABCVZfW9mENRhCPf5k09ASPOsuZ3CD3qJABWQ++ou88pK
5t7dLnFcBeg0Hnub+VW708osXeL1RV5P9BbGlDGNB66jIzAhMA4GA1UdDwEB/wQE
AwICpDAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIEiggdkVFIBA
avyGanfnRzx9heAG0ShSlK51pPe7nRqJAiEA3f10CN14BnCywbaCkRED2UVRzF3i
1KvlTdTQFExZvmw=
-----END CERTIFICATE-----
```

Make a note of that certificate! 

Before we leave our cluster terminal; run `ip addr` to get our cluster master node IP and make a note of it.
```
	2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
  	  link/ether da:29:d1:aa:c0:ef brd ff:ff:ff:ff:ff:ff
    	inet 192.168.3.38/24 brd 192.168.3.255 scope global dynamic ens18
      	 valid_lft 85598sec preferred_lft 85598sec
    	inet6 fe80::d829:d1ff:feaa:c0ef/64 scope link
      	 valid_lft forever preferred_lft forever
```
We're now ready to import everything and connect to the cluster, but first we need to let your Gitlab talk to the local network, visit `/admin/application_settings/network` in your Gitlab GUI and expand `Outbound Requests` then check both checkboxes and save.

![screenshot_6.png](/screenshot_6.png)

## Adding the Cluster
Navigate to `/admin/clusters` in your GitLab UI and click `Add Kuberenetes Cluster` then click the `Add Existing Cluster` tab.

* Kubernetes cluster name: local-k3s-cluster
* Environment scope: *
* API URL: https://(your ip from ip addr above):6443
* CA Certificate:

	`<insert the PEM formated certificate from above>`

* Service Token:

	`<insert the service token you noted above>`
    
* RBAC-enabled cluster & GitLab-managed cluster should both be checked.

Now click `Add Cluster` and you will be presented with the Cluster Deatials page.

You can fill in the base domain you intend to use with your preview apps i.e. k8s.example.com and make a wildcard DNS entry to point to your **ingress IP** (See below) that you forward to in your firewall.

Click **Applications**.

## Applications
To get your ingress IP start by installing the ingress controller;

![screenshot_3.png](/screenshot_3.png)

Once it completes you should get a screen with your ingress IP filled in like this;

![screenshot_4.png](/screenshot_4.png)

This is where you point your firewall or reverse proxy to.

---

Your cluster now looks like this;

![screenshot_7.png](/screenshot_7.png)

Ok great, now we know both metallb and gitlab works properly :)

## Installing Prometheus

To keep an eye on the health of your gitlab managed apps; Click Install on Prometheus.

![screenshot_1.png](/screenshot_1.png)

Once the installation completes and you click on Health you'll see some basic stats from your cluster.

![screenshot_8.png](/screenshot_8.png)

## Installing Gitlab Runner

Installing the GitLab runner is now as easy as hitting **Install**, and you're ready for Auto DevOps pipelines.

![screenshot_2.png](/screenshot_2.png)



# Wrap up
Ok so now you have a complete integration and can use the Auto DevOps feature on your local k3s cluster.

- Gitlab Runners
- Review App deployments
- etc :)

![screenshot_9.png](/screenshot_9.png)

It will automatically clean up.

![screenshot_5.png](/screenshot_5.png)

# Extras
Some additional nifty things that you might want to take a peek at.

## Adding a WSL 2 box to the cluster
> NOTE: This requires you to have a WSL2 installation thats routable on the network you have the other nodes at. **THIS IS NOT THE DEFAULT!**
{.is-info}
### Prerequisites;
k3s requires systemd or openrc, neither are installed on WSL, I successfuly got it running by using the following;
```
	sudo apt install git
```
```
	git clone https://github.com/DamionGans/ubuntu-wsl2-systemd-script.git
```
```
	cd ubuntu-wsl2-systemd-script/
```
```bash
	bash ubuntu-wsl2-systemd-script.sh
```
   Enter your password and wait until the script has finished
	 Now exit the shell and run it again to update the paths and run `systemctl` to test.
   You now have services on WSL 2.

## Adding worker nodes

To add worker nodes to the cluster you need the master token.
  
On your master node run;
~~~  
cat /var/lib/rancher/k3s/server/node-token
~~~
Will spit out a string;
```
K1010bd9de86fa7975c6c5b76897299ce0007a168a4f66e2e1ee8a6c5cdfdf4c648::server:e750f32c4cafc84f2a4541f20e6331ea
```
Use it like this **ON** the machine you wish to add to the cluster
```bash
    export K3S_URL="https://192.168.3.38:6443"
    export K3S_KUBECONFIG_MODE="644" # This is important if you don't run as root
    export K3S_TOKEN="*insert the node token you got above*"
    export K3S_NODE_NAME="nodename" # If you want to name your node separate from hostname, use this.
```
Since you have set the `K3S_TOKEN` environment variable the installer is smart enough to only install the agent.
```
	curl -sfL https://get.k3s.io | sh -
```
Should give you something like this;
```
    [INFO]  Finding latest release
    [INFO]  Using v1.18.8+k3s1 as release
    [INFO]  Downloading hash https://github.com/rancher/k3s/releases/download/v1.18.8+k3s1/sha256sum-arm64.txt
    [INFO]  Downloading binary https://github.com/rancher/k3s/releases/download/v1.18.8+k3s1/k3s-arm64
    [INFO]  Verifying binary download
    [INFO]  Installing k3s to /usr/local/bin/k3s
    [INFO]  Creating /usr/local/bin/kubectl symlink to k3s
    [INFO]  Creating /usr/local/bin/crictl symlink to k3s
    [INFO]  Creating /usr/local/bin/ctr symlink to k3s
    [INFO]  Creating killall script /usr/local/bin/k3s-killall.sh
    [INFO]  Creating uninstall script /usr/local/bin/k3s-agent-uninstall.sh
    [INFO]  env: Creating environment file /etc/systemd/system/k3s-agent.service.env
    [INFO]  systemd: Creating service file /etc/systemd/system/k3s-agent.service
    [INFO]  systemd: Enabling k3s-agent unit
    Created symlink /etc/systemd/system/multi-user.target.wants/k3s-agent.service → /etc/systemd/system/k3s-agent.service.
    [INFO]  systemd: Starting k3s-agent
```
To confirm it is working run;
```
	service k3s-agent status
```  
Shows you if everything is working;
```
    ● k3s-agent.service - Lightweight Kubernetes
     Loaded: loaded (/etc/systemd/system/k3s-agent.service; enabled; vendor preset: enabled)
     Active: active (running) since Thu 2020-09-10 09:32:35 CEST; 11s ago
       Docs: https://k3s.io
    Process: 16414 ExecStartPre=/sbin/modprobe overlay (code=exited, status=0/SUCCESS)
      Process: 16413 ExecStartPre=/sbin/modprobe br_netfilter (code=exited, status=0/SUCCESS)
     Main PID: 16415 (k3s-agent)
        Tasks: 28
       CGroup: /system.slice/k3s-agent.service
               ├─16415 /usr/local/bin/k3s agent
               └─16454 containerd -c /var/lib/rancher/k3s/agent/etc/containerd/config.toml -a ...

```
I added an WSL 2 box and the cluster now looks like this;
```
    kubectl get node -o wide
```
```
    NAME     STATUS   ROLES    AGE     VERSION        INTERNAL-IP     EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION                CONTAINER-RUNTIME
    taurus   Ready    <none>   4m25s   v1.18.8+k3s1   172.31.106.59   <none>        Ubuntu 18.04.5 LTS   4.19.104-microsoft-standard   containerd://1.3.3-k3s2
    k3s      Ready    master   19h     v1.18.8+k3s1   192.168.3.38    <none>        Ubuntu 20.04 LTS     5.4.0-45-generic              containerd://1.3.3-k3s2
```
As you see the newly added node has Roles: None, this is an open issue in k3s but you can fix it by running;
```bash
	kubectl label node ${node} node-role.kubernetes.io/worker=worker
```
## Removing a worker node
If you need to remove a node without destroying the cluster, do this.
In this example the worker node have the name "`taurus`".
```bash
export node=taurus
```
On a machine with kubectl access:
```bash
	kubectl drain ${node} --ignore-daemonsets --delete-local-data
```  
Wait for it to drain
```bash
	kubectl delete node ${node}
```  

## Installing Rancher 2.x

If you feel like you want a nice control plane for your cluser, try Rancher.
If you have an external reverse proxy that handles TLS the below will work for you.

Install helm
~~~
span install helm --classic
~~~
For the latest use;
```
	helm repo add rancher-latest https://releases.rancher.com/server-charts/latest
``` 
For stable use;
```
	helm repo add rancher-latest https://releases.rancher.com/server-charts/stable
```
Update the repos;
```
	helm repo update
```
Now you need to setup the namespace cattle-system;
```
	kubectl create namespace cattle-system
```
And finally install the chart; **Make sure you change the hostname!**
> I use an HAProxy inbetween the Firewall and Internal services that handles TLS and make sure the X-Forwarded-Host headers are added so my install looks like this, you might want to change these flags.
{.is-info}

If you want to manage the cluster you just setup through Rancher set `--set addLocal="true"` if you don't; use `--set addLocal="false"` this is if you just want to host the Rancher installation on this cluster but want to manage other clusters.

You can always import the local cluster later once rancher has started.
```bash
	helm install rancher rancher-latest/rancher --namespace cattle-system --set hostname=rancher.example.com --set tls=external --set addLocal="true" --set ingress.configurationSnippet='more_set_input_headers X-Forwarded-Host {{ .Values.hostname }};'
```  
You should now see something like;
```
    NAME: rancher
    LAST DEPLOYED: Thu Sep 10 10:41:04 2020
    NAMESPACE: cattle-system
    STATUS: deployed
    REVISION: 1
    TEST SUITE: None
    NOTES:
    Rancher Server has been installed.

    NOTE: Rancher may take several minutes to fully initialize. Please standby while Certificates are being issued and Ingress comes up.

    Check out our docs at https://rancher.com/docs/rancher/v2.x/en/

    Browse to https://rancher.example.com
```

Check what IP the rancher service got;
~~~
kubectl get ingress --all-namespaces
~~~
## Installing KubeNT

Find deprecated api calls in your cluster;
```bash
    sh -c "$(curl -sSL https://git.io/install-kubent)"
```
```
    >>> kubent installation script <<<
    > Detecting latest version
    > Downloading version 0.3.1
      % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                     Dload  Upload   Total   Spent    Left  Speed
    100   657  100   657    0     0   1961      0 --:--:-- --:--:-- --:--:--  1961
    100 6811k  100 6811k    0     0  2978k      0  0:00:02  0:00:02 --:--:-- 4723k
    > Done. kubent was installed to /usr/local/bin/.
```
Running it will give your a report.
```
 	 kubent
```
```plaintext
    9:58AM INF >>> Kube No Trouble `kubent` <<<
    9:58AM INF version 0.3.1 (git sha dev)
    9:58AM INF Initializing collectors and retrieving data
    9:58AM INF Retrieved 4 resources from collector name=Cluster
    9:58AM INF Retrieved 33 resources from collector name="Helm v2"
    9:58AM INF Retrieved 0 resources from collector name="Helm v3"
    9:58AM INF Loaded ruleset name=deprecated-1-16.rego
    9:58AM INF Loaded ruleset name=deprecated-1-22.rego
```


# Tearing everything down
If you want to clean your machine and remove everything you tried above;

On the worker node(s); you can nuke k3s from the system.
```  
	sudo /usr/local/bin/k3s-agent-uninstall.sh
 	sudo rm -rf /var/lib/rancher
```

On your server / master node:
```
	sudo /usr/local/bin/k3s-uninstall.sh
	sudo rm -rf /var/lib/rancher
```
> Teardown is kinda buggy and leaves orphans on the nodes, there are open issues on this, so hopefully will be better going forward.
{.is-warning}

# Final Words

I hope you found this little guide useful! I'm currently using this exact setup to create quick devops clusters and nodes, so if you have ideas on how this could be improved let me know in the comments below ;)

Thank you.
