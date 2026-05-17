package com.insurance.common.workflow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransitionRequest {

    private String workflowType;
    private String entityId;
    private String currentState;
    private String triggerEvent;
    private String actorId;
    private String actorRole;
    private String notes;
    private String metadataJson;
}
