package com.renixst.flux.utils;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class DateTimeUtils {

    private static final SimpleDateFormat ISO_FORMAT = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
    private static final SimpleDateFormat DISPLAY_FORMAT = new SimpleDateFormat("HH:mm", Locale.US);
    private static final SimpleDateFormat DATE_FORMAT = new SimpleDateFormat("dd/MM/yyyy", Locale.US);

    public static String formatTime(String isoDateTime) {
        try {
            Date date = ISO_FORMAT.parse(isoDateTime);
            return DISPLAY_FORMAT.format(date);
        } catch (ParseException e) {
            return "";
        }
    }

    public static String formatDate(String isoDateTime) {
        try {
            Date date = ISO_FORMAT.parse(isoDateTime);
            return DATE_FORMAT.format(date);
        } catch (ParseException e) {
            return "";
        }
    }

    public static String formatDateTime(String isoDateTime) {
        try {
            Date date = ISO_FORMAT.parse(isoDateTime);
            SimpleDateFormat dateTimeFormat = new SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.US);
            return dateTimeFormat.format(date);
        } catch (ParseException e) {
            return "";
        }
    }

    public static String getRelativeTime(String isoDateTime) {
        try {
            Date date = ISO_FORMAT.parse(isoDateTime);
            long diff = System.currentTimeMillis() - date.getTime();
            long minutes = diff / (60 * 1000);
            long hours = diff / (60 * 60 * 1000);
            long days = diff / (24 * 60 * 60 * 1000);

            if (minutes < 1) {
                return "Now";
            } else if (minutes < 60) {
                return minutes + "m ago";
            } else if (hours < 24) {
                return hours + "h ago";
            } else if (days < 7) {
                return days + "d ago";
            } else {
                return DATE_FORMAT.format(date);
            }
        } catch (ParseException e) {
            return "";
        }
    }
}
