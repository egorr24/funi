package com.flux.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.util.AttributeSet;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;

import java.util.Random;

public class NeuralGhostView extends SurfaceView implements SurfaceHolder.Callback, Runnable {

    private Thread renderThread;
    private boolean isRunning = false;
    private Bitmap sourceBitmap;
    private SurfaceHolder holder;
    private long frameCounter = 0;
    private final Random random = new Random();
    private final Paint paint = new Paint();
    private final Paint slicePaint = new Paint();
    
    // v12 Ultra Config
    private final int SLICE_COUNT = 128;

    public NeuralGhostView(Context context, AttributeSet attrs) {
        super(context, attrs);
        holder = getHolder();
        holder.addCallback(this);
    }

    public void setImage(Bitmap bitmap) {
        this.sourceBitmap = bitmap;
    }

    @Override
    public void surfaceCreated(SurfaceHolder holder) {
        isRunning = true;
        renderThread = new Thread(this);
        renderThread.start();
    }

    @Override
    public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {}

    @Override
    public void surfaceDestroyed(SurfaceHolder holder) {
        isRunning = false;
        try {
            renderThread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void run() {
        while (isRunning) {
            if (holder.getSurface().isValid() && sourceBitmap != null) {
                Canvas canvas = holder.lockCanvas();
                if (canvas != null) {
                    render(canvas);
                    holder.unlockCanvasAndPost(canvas);
                }
            }
            try {
                Thread.sleep(8); 
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    private void render(Canvas canvas) {
        frameCounter++;
        int width = getWidth();
        int height = getHeight();

        canvas.drawColor(Color.BLACK);

        int phase = (int) (frameCounter % 2);
        float sliceWidth = (float) width / SLICE_COUNT;
        float sourceSliceWidth = (float) sourceBitmap.getWidth() / SLICE_COUNT;

        for (int i = 0; i < SLICE_COUNT; i++) {
            boolean isMainPhase = (i % 2 == phase);
            
            if (isMainPhase) {
                float hueShift = phase == 0 ? 8f : -8f;
                applyColorFilter(slicePaint, hueShift, 1.0f);
                slicePaint.setAlpha(255);
            } else {
                float hueShift = phase == 0 ? -8f : 8f;
                applyColorFilter(slicePaint, hueShift, 0.35f);
                slicePaint.setAlpha(90);
            }

            android.graphics.Rect src = new android.graphics.Rect(
                (int)(i * sourceSliceWidth), 0, 
                (int)((i + 1) * sourceSliceWidth), sourceBitmap.getHeight()
            );
            android.graphics.Rect dst = new android.graphics.Rect(
                (int)(i * sliceWidth), 0, 
                (int)((i + 1) * sliceWidth), height
            );

            canvas.drawBitmap(sourceBitmap, src, dst, slicePaint);
        }

        paint.setColor(phase == 0 ? Color.argb(5, 255, 255, 255) : Color.argb(5, 0, 0, 0));
        for (int y = 0; y < height; y += 3) {
            for (int x = (int)(frameCounter % 4); x < width; x += 4) {
                canvas.drawRect(x, y, x + 1, y + 1, paint);
            }
        }

        if (random.nextFloat() > 0.98) {
            canvas.drawColor(Color.argb(25, 255, 255, 255));
        }
    }

    private void applyColorFilter(Paint p, float hueShift, float brightness) {
        ColorMatrix cm = new ColorMatrix();
        cm.setScale(brightness, brightness, brightness, 1.0f);
        
        float cos = (float) Math.cos(Math.toRadians(hueShift));
        float sin = (float) Math.sin(Math.toRadians(hueShift));
        float[] mat = {
            0.213f + 0.787f * cos - 0.213f * sin, 0.715f - 0.715f * cos - 0.715f * sin, 0.072f - 0.072f * cos + 0.928f * sin, 0, 0,
            0.213f - 0.213f * cos + 0.143f * sin, 0.715f + 0.285f * cos + 0.140f * sin, 0.072f - 0.072f * cos - 0.283f * sin, 0, 0,
            0.213f - 0.213f * cos - 0.787f * sin, 0.715f - 0.715f * cos + 0.715f * sin, 0.072f + 0.928f * cos + 0.072f * sin, 0, 0,
            0, 0, 0, 1, 0
        };
        cm.postConcat(new ColorMatrix(mat));
        p.setColorFilter(new ColorMatrixColorFilter(cm));
    }
}
