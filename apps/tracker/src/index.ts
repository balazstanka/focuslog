import { recordActiveWindow } from "./services/tracker";

setInterval(() => recordActiveWindow(), 1000);
