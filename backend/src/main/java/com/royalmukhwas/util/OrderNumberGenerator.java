package com.royalmukhwas.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

public class OrderNumberGenerator {
    private static final AtomicInteger counter = new AtomicInteger(1);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyMMdd");

    public static String generate() {
        String date = LocalDateTime.now().format(FMT);
        int seq = counter.getAndIncrement() % 10000;
        return String.format("RM-%s-%04d", date, seq);
    }
}
