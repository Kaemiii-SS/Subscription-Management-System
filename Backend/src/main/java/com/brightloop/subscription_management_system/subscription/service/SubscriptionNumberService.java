package com.brightloop.subscription_management_system.subscription.service;

import com.brightloop.subscription_management_system.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SubscriptionNumberService {

    private final SubscriptionRepository subscriptionRepository;

    public String generate() {
        Long sequence = subscriptionRepository.getNextSubscriptionSequence();

        return String.format(
                Locale.ROOT,
                "SUB-%d-%05d",
                Year.now().getValue(),
                sequence
        );
    }
}