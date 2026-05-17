package com.insurance.document.generator;

import java.util.Map;

public interface PdfGeneratorService {

    byte[] generate(String templateContent, Map<String, Object> variables);
}
