/**
 * @description Pluggable Interface for AI Model Providers (Einstein, BYO-LLM, Mock).
 * Enables the Smart Grid to connect to any LLM or external agent transparently.
 */
public interface ISmartGridAIProvider {
  /**
   * @description Translates a natural language user prompt into a structured query specification.
   * @param request The translation request parameters and schema context
   * @return Structured translation result containing filters, sorting, and validated SOQL
   */
  SmartGridNLPEngine.TranslationResult translateQuery(
    SmartGridNLPEngine.TranslationRequest request
  );

  /**
   * @description Answers analytical questions about active grid data in natural language.
   * @param request The assistant question context including active filters and visible fields
   * @return Conversational response with computed values
   */
  SmartGridNLPEngine.AssistantResult answerQuestion(
    SmartGridNLPEngine.AssistantRequest request
  );
}
