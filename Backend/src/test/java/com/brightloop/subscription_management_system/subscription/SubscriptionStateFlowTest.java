package com.brightloop.subscription_management_system.subscription;

import com.brightloop.subscription_management_system.catalog.entity.Plan;
import com.brightloop.subscription_management_system.subscription.entity.Subscription;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SubscriptionStateFlowTest {

    @Test
    @DisplayName("Subscription lifecycle transitions through allowed state machine")
    void testValidTransitions() {
        Subscription sub = new Subscription();
        assertEquals("DRAFT", sub.getStatus());

        // DRAFT -> QUOTATION
        sub.transitionTo("QUOTATION");
        assertEquals("QUOTATION", sub.getStatus());

        // QUOTATION -> CONFIRMED
        sub.transitionTo("CONFIRMED");
        assertEquals("CONFIRMED", sub.getStatus());

        // CONFIRMED -> ACTIVE
        sub.transitionTo("ACTIVE");
        assertEquals("ACTIVE", sub.getStatus());

        // ACTIVE -> PAUSED
        sub.transitionTo("PAUSED");
        assertEquals("PAUSED", sub.getStatus());

        // PAUSED -> ACTIVE
        sub.transitionTo("ACTIVE");
        assertEquals("ACTIVE", sub.getStatus());

        // ACTIVE -> CLOSED
        sub.transitionTo("CLOSED");
        assertEquals("CLOSED", sub.getStatus());
    }

    @Test
    @DisplayName("Disallowed transitions must throw IllegalStateException")
    void testDisallowedTransitions() {
        Subscription sub = new Subscription();
        assertEquals("DRAFT", sub.getStatus());

        // Cannot jump from DRAFT to ACTIVE
        assertThrows(IllegalStateException.class, () -> sub.transitionTo("ACTIVE"));

        // Cannot jump from DRAFT to CLOSED
        assertThrows(IllegalStateException.class, () -> sub.transitionTo("CLOSED"));

        sub.setStatus("CLOSED");
        // CLOSED is terminal
        assertThrows(IllegalStateException.class, () -> sub.transitionTo("ACTIVE"));
        assertThrows(IllegalStateException.class, () -> sub.transitionTo("DRAFT"));
    }
}
