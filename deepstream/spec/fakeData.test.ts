import { fillArray } from "./fakeData";

describe("Fake Data generator", () => {
   it("should populate an array when given a generator and count > 1", function() {
      const gen = () => ({});
      const output = fillArray(gen, 2);
      expect(output.length).toEqual(2);
   });

   it("should populate an array when given a generator and count = 1", function() {
      const gen = () => ({});
      const output = fillArray(gen, 1);
      expect(output.length).toEqual(1);
   });
});
