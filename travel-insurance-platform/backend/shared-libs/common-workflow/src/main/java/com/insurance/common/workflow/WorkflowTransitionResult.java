package com.insurance.common.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransitionResult {

    private boolean success;
    private String previousState;
    private String newState;
    private String message;
    private boolean autoTransitionTriggered;
    private String autoTransitionNewState;
}
