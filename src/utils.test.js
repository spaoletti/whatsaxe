import { validateDice } from "./utils";

describe("Dice expression validation", () => {

  test.each([
    ["1d4"], 
    ["1d6"],
    ["1d8"],
    ["1d10"],
    ["1d12"],
    ["1d20"],
    ["20d20"],
    ["3d8"],
  ])("%p should pass", (dice) => {
    validateDice(dice);
  });

  test.each([
    ["vvd4"], 
    ["1v20"], 
    ["1d3"], 
    ["1d7"]
  ])("%p should fail", (dice) => {
    expect(() => validateDice(dice)).toThrow(`Unknown dice: ${dice}`);
  });

});