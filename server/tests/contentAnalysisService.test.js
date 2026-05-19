const {
  analyzeDom,
  analyzeHash,
  classifyDomChange,
} = require("../services/contentAnalysisService");

describe("content analysis service", () => {
  test("detects ticking text changes through HASH and DOM analysis", () => {
    const firstHtml =
      '<html><body><main><div id="clock">12:00:00</div></main></body></html>';
    const secondHtml =
      '<html><body><main><div id="clock">12:00:01</div></main></body></html>';

    const firstHash = analyzeHash(firstHtml);
    const secondHash = analyzeHash(secondHtml);
    const firstDom = analyzeDom(firstHtml);
    const secondDom = analyzeDom(secondHtml);

    expect(firstHash.hash).not.toBe(secondHash.hash);
    expect(classifyDomChange(firstDom, secondDom)).toContain("TEXT");
    expect(secondDom.memoryMb).toBeGreaterThanOrEqual(secondHash.memoryMb);
  });
});
