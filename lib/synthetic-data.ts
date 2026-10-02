export const COMPONENTS = ["MCU", "DC/DC converter", "Voltage regulator", "CAN transceiver", "MOSFET power stage", "Flash memory"];

export type ECUConfig = {
  ecuType: string;
  supplyVoltage: string;
  temperatureRange: string;
  mcuType: string;
  interface: string;
  systemLoad: string;
  components: string[];
};

export type Recommendation = {
  id: string;
  name: string;
  priority: "P1" | "P2" | "P3";
  condition: string;
  target: string;
  failure: string;
  designCharacteristic: string;
  reason: string;
  score: number;
  breakdown: Record<string, number>;
};

export const DEFAULT_CONFIG: ECUConfig = {
  ecuType: "Powertrain",
  supplyVoltage: "12 V",
  temperatureRange: "−40 to 125 °C",
  mcuType: "32-bit lockstep",
  interface: "CAN FD",
  systemLoad: "85% peak",
  components: [...COMPONENTS],
};

type Rule = Omit<Recommendation, "priority" | "score" | "breakdown"> & { components: string[]; base: [number, number, number, number] };

const RULES: Rule[] = [
  { id: "thermal-brownout", name: "High-temperature + low-voltage startup", condition: "125 °C · 6.0 V crank profile · 30 restarts", target: "Voltage regulator + MCU", failure: "Brownout reset instability", designCharacteristic: "12 V supply · 125 °C ceiling", reason: "The combined thermal ceiling, cranking undervoltage and MCU reset path create a high-coupling startup risk.", components: ["Voltage regulator", "MCU"], base: [28, 25, 21, 18] },
  { id: "power-cycle", name: "Rapid power cycling", condition: "0–14 V · 2 Hz · 1,000 cycles", target: "DC/DC converter", failure: "Inrush fatigue / latch-up", designCharacteristic: "High peak system load", reason: "Repeated inrush under high load exposes converter soft-start and protection sequencing weaknesses.", components: ["DC/DC converter", "MOSFET power stage"], base: [24, 24, 16, 20] },
  { id: "transient", name: "Voltage transient immunity", condition: "ISO-like +45 V / −14 V synthetic pulses", target: "MOSFET power stage", failure: "Avalanche overstress", designCharacteristic: "12 V switched power domain", reason: "A switched power domain and selected power-stage devices make transient energy handling a high-value stress case.", components: ["MOSFET power stage", "Voltage regulator"], base: [25, 22, 15, 18] },
  { id: "can-thermal", name: "High-temperature CAN load", condition: "125 °C · 95% bus load · 8 h soak", target: "CAN transceiver", failure: "Thermal communication dropout", designCharacteristic: "CAN FD interface · peak load", reason: "Sustained bus utilization at the upper temperature limit stresses transceiver timing and thermal margin.", components: ["CAN transceiver"], base: [24, 23, 20, 16] },
  { id: "cold-restart", name: "Cold-start restart", condition: "−40 °C · 7.2 V · watchdog recovery", target: "MCU + Flash memory", failure: "Boot-time memory read fault", designCharacteristic: "Low-temperature boot sequence", reason: "Cold memory timing combined with a depressed supply can disrupt boot integrity and watchdog recovery.", components: ["MCU", "Flash memory"], base: [23, 25, 18, 14] },
  { id: "load-step", name: "Dynamic load-step response", condition: "20–95% load · 1 ms edge · thermal soak", target: "DC/DC converter", failure: "Output rail undershoot", designCharacteristic: "85% peak computational load", reason: "Fast load transitions can exceed converter compensation margin and violate MCU supply supervision thresholds.", components: ["DC/DC converter", "MCU"], base: [22, 20, 17, 18] },
  { id: "flash-endurance", name: "Thermal flash endurance", condition: "105 °C · 5,000 write/read sequences", target: "Flash memory", failure: "Data retention drift", designCharacteristic: "High-temperature nonvolatile storage", reason: "Repeated programming at temperature accelerates retention drift in calibration and diagnostic storage paths.", components: ["Flash memory"], base: [18, 24, 20, 10] },
];

export function generateRecommendations(config: ECUConfig): Recommendation[] {
  const highTemp = config.temperatureRange.includes("125");
  const cold = config.temperatureRange.includes("−40");
  const highLoad = config.systemLoad.includes("85");
  const can = config.interface.includes("CAN");
  const supply12 = config.supplyVoltage === "12 V";

  return RULES.filter((rule) => rule.components.some((component) => config.components.includes(component)))
    .map((rule) => {
      const values = [...rule.base];
      if (!highTemp && ["thermal-brownout", "can-thermal", "flash-endurance"].includes(rule.id)) values[2] -= 6;
      if (!cold && rule.id === "cold-restart") values[2] -= 7;
      if (!highLoad && ["power-cycle", "load-step", "can-thermal"].includes(rule.id)) values[3] -= 5;
      if (!can && rule.id === "can-thermal") values[0] -= 8;
      if (!supply12 && ["thermal-brownout", "transient"].includes(rule.id)) values[0] -= 6;
      if (config.ecuType === "Battery management" && ["transient", "load-step"].includes(rule.id)) values[1] += 4;
      const score = Math.min(98, Math.max(45, values.reduce((sum, value) => sum + value, 0)));
      return {
        ...rule,
        score,
        priority: score >= 85 ? "P1" : score >= 72 ? "P2" : "P3",
        breakdown: { "Design relevance": values[0], "Historical failure association": values[1], "Environmental stress": values[2], "Scenario interaction": values[3] },
      } as Recommendation;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export type FailureRecord = { id: string; ecu: string; component: string; mechanism: string; temperature: string; voltage: string; condition: string; severity: number };

const rows: Array<[string, string, string, string, string, string, number]> = [
  ["Powertrain", "Voltage regulator", "Brownout instability", "Hot", "Undervoltage", "Startup", 9],
  ["Body control", "CAN transceiver", "Communication dropout", "Hot", "Nominal", "High bus load", 7],
  ["Chassis", "MCU", "Watchdog reset", "Cold", "Undervoltage", "Cold start", 8],
  ["Powertrain", "MOSFET power stage", "Avalanche overstress", "Ambient", "Transient", "Load dump", 10],
  ["Battery management", "DC/DC converter", "Output rail undershoot", "Hot", "Nominal", "Load step", 8],
  ["Body control", "Flash memory", "Data retention drift", "Hot", "Nominal", "Write cycling", 6],
  ["Powertrain", "DC/DC converter", "Inrush fatigue", "Ambient", "Power cycling", "Rapid cycling", 8],
  ["Chassis", "CAN transceiver", "Communication dropout", "Cold", "Undervoltage", "Cold start", 7],
  ["Battery management", "Voltage regulator", "Thermal shutdown", "Hot", "Overvoltage", "High load", 9],
  ["Powertrain", "MCU", "Brownout instability", "Hot", "Undervoltage", "Startup", 9],
  ["Body control", "MOSFET power stage", "Gate threshold drift", "Cold", "Nominal", "Actuator drive", 6],
  ["Chassis", "Flash memory", "Boot read fault", "Cold", "Undervoltage", "Cold start", 8],
  ["Battery management", "CAN transceiver", "Protocol timing drift", "Hot", "Nominal", "High bus load", 7],
  ["Powertrain", "Voltage regulator", "Output oscillation", "Ambient", "Power cycling", "Rapid cycling", 8],
  ["Body control", "DC/DC converter", "Output rail undershoot", "Cold", "Undervoltage", "Startup", 7],
  ["Chassis", "MCU", "Clock startup delay", "Cold", "Nominal", "Cold start", 6],
  ["Battery management", "MOSFET power stage", "Avalanche overstress", "Hot", "Transient", "Load dump", 10],
  ["Powertrain", "Flash memory", "Data retention drift", "Hot", "Nominal", "High load", 7],
  ["Body control", "CAN transceiver", "Communication dropout", "Ambient", "Transient", "Bus fault", 8],
  ["Chassis", "Voltage regulator", "Brownout instability", "Cold", "Undervoltage", "Startup", 8],
  ["Battery management", "DC/DC converter", "Thermal shutdown", "Hot", "Nominal", "High load", 9],
  ["Powertrain", "MCU", "Watchdog reset", "Ambient", "Power cycling", "Rapid cycling", 7],
  ["Body control", "Flash memory", "Boot read fault", "Cold", "Nominal", "Cold start", 6],
  ["Chassis", "MOSFET power stage", "Inrush fatigue", "Hot", "Power cycling", "Actuator drive", 8],
  ["Battery management", "Voltage regulator", "Output oscillation", "Ambient", "Transient", "Load step", 7],
  ["Powertrain", "CAN transceiver", "Protocol timing drift", "Hot", "Nominal", "High bus load", 7],
];

export const FAILURE_RECORDS: FailureRecord[] = rows.map(([ecu, component, mechanism, temperature, voltage, condition, severity], index) => ({ id: `SF-${String(index + 1).padStart(3, "0")}`, ecu, component, mechanism, temperature, voltage, condition, severity }));

export const TEST_CANDIDATES = Array.from({ length: 50 }, (_, index) => {
  const names = ["Thermal crank", "Power cycle", "Transient pulse", "CAN saturation", "Cold restart", "Load step", "Flash endurance", "Bus fault"];
  const score = Math.max(44, 96 - index - Math.floor(index / 7));
  return { id: `T-${String(index + 1).padStart(2, "0")}`, name: `${names[index % names.length]} · Variant ${Math.floor(index / names.length) + 1}`, score };
});
