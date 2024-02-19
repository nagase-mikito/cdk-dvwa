export class Naming {
  public static appName = "security-learning-box";

  public static of(name: string): string {
    return `${this.appName}-${name}`;
  }
}
