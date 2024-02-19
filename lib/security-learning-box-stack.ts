import ec2 = require("aws-cdk-lib/aws-ec2");
import {
  ApplicationProtocol,
  ApplicationTargetGroup,
  TargetType,
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import ecs = require("aws-cdk-lib/aws-ecs");
import ecs_patterns = require("aws-cdk-lib/aws-ecs-patterns");
import cdk = require("aws-cdk-lib");
import { ContainerImage, FargateTaskDefinition } from "aws-cdk-lib/aws-ecs";
import { Naming } from "./naming";

export class SecurityLearningBoxStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPCとECSクラスターを作成
    const vpc = new ec2.Vpc(this, "vpc", {
      vpcName: Naming.of("vpc"),
      maxAzs: 2,
      natGateways: 1,
    });
    const cluster = new ecs.Cluster(this, "Cluster", {
      clusterName: Naming.of("cluster"),
      vpc: vpc,
    });

    // ECSのタスク定義
    const taskDefinition = new FargateTaskDefinition(
      this,
      "task-definition",
      {}
    );
    taskDefinition.addContainer("sample", {
      image: ContainerImage.fromRegistry("vulnerables/web-dvwa:latest"),
      portMappings: [{ containerPort: 80 }],
    });

    // ALBとFargateサービスを作成
    const albFargate = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "FargateService",
      {
        cluster,
        loadBalancerName: Naming.of("alb"),
        taskDefinition: taskDefinition,
        taskSubnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
      }
    );
    // ターゲットグループのヘルスチェックを設定
    albFargate.targetGroup.configureHealthCheck({
      path: "/login.php",
    });
    // 登録解除の遅延設定を変更
    albFargate.targetGroup.setAttribute(
      "deregistration_delay.timeout_seconds",
      "30"
    );
  }
}
