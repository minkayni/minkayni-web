/* Imprime los tokens CSS de los resortes de src/scripts/spring.ts para pegarlos
   en el @theme de global.css. tests/spring.test.ts falla si se desincronizan.
   Uso: pnpm exec tsx tools/springs.ts */
import { SPRINGS, springLinear } from "../src/scripts/spring";

for (const [name, cfg] of Object.entries(SPRINGS)) {
    const { easing, duration } = springLinear(cfg);
    console.log(`    --ease-spring-${name}: ${easing};`);
    console.log(`    --spring-${name}-duration: ${duration}ms;`);
}
