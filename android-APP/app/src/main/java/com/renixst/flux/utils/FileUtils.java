package com.renixst.flux.utils;

import android.content.Context;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class FileUtils {

    public static File getOutputMediaFile(Context context, String type) {
        File mediaStorageDir = new File(context.getExternalFilesDir(null), "FluxMedia");

        if (!mediaStorageDir.exists()) {
            if (!mediaStorageDir.mkdirs()) {
                return null;
            }
        }

        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        
        if ("image".equals(type)) {
            return new File(mediaStorageDir.getPath() + File.separator + "IMG_" + timeStamp + ".jpg");
        } else if ("audio".equals(type)) {
            return new File(mediaStorageDir.getPath() + File.separator + "AUD_" + timeStamp + ".mp4");
        } else if ("video".equals(type)) {
            return new File(mediaStorageDir.getPath() + File.separator + "VID_" + timeStamp + ".mp4");
        }

        return null;
    }

    public static String getFileSize(long bytes) {
        if (bytes <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(bytes) / Math.log10(1024));
        return String.format("%.1f %s", bytes / Math.pow(1024, digitGroups), units[digitGroups]);
    }
}
