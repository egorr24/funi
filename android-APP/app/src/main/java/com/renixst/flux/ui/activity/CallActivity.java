package com.renixst.flux.ui.activity;

import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.renixst.flux.R;
import com.renixst.flux.managers.SessionManager;
import com.renixst.flux.models.Call;
import com.renixst.flux.network.ApiService;
import com.renixst.flux.network.NetworkModels.AnswerCallRequest;
import com.renixst.flux.network.RetrofitClient;
import retrofit2.Callback;
import retrofit2.Response;

public class CallActivity extends AppCompatActivity {

    private TextView callerNameTextView;
    private TextView callTypeTextView;
    private ImageView callerAvatarImageView;
    private Button answerButton;
    private Button rejectButton;
    private Button endCallButton;
    
    private SessionManager sessionManager;
    private String callId;
    private String callType;
    private String receiverId;
    private String chatId;
    private boolean isCallActive = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_call);

        sessionManager = new SessionManager(this);

        callId = getIntent().getStringExtra("callId");
        callType = getIntent().getStringExtra("callType");
        receiverId = getIntent().getStringExtra("receiverId");
        chatId = getIntent().getStringExtra("chatId");

        callerNameTextView = findViewById(R.id.callerNameTextView);
        callTypeTextView = findViewById(R.id.callTypeTextView);
        callerAvatarImageView = findViewById(R.id.callerAvatarImageView);
        answerButton = findViewById(R.id.answerButton);
        rejectButton = findViewById(R.id.rejectButton);
        endCallButton = findViewById(R.id.endCallButton);

        String callerName = getIntent().getStringExtra("callerName");
        callerNameTextView.setText(callerName);
        callTypeTextView.setText("Incoming " + callType + " call");

        answerButton.setOnClickListener(v -> answerCall());
        rejectButton.setOnClickListener(v -> rejectCall());
        endCallButton.setOnClickListener(v -> endCall());
    }

    private void answerCall() {
        // Generate SDP answer (simplified - in production use WebRTC)
        String sdpAnswer = generateSDP();
        
        AnswerCallRequest request = new AnswerCallRequest(sdpAnswer);
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.answerCall(callId, request, token).enqueue(new retrofit2.Callback<com.renixst.flux.models.Call>() {
            @Override
            public void onResponse(retrofit2.Call<com.renixst.flux.models.Call> call, Response<com.renixst.flux.models.Call> response) {
                if (response.isSuccessful()) {
                    isCallActive = true;
                    updateUIForActiveCall();
                    Toast.makeText(CallActivity.this, "Call answered", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(retrofit2.Call<Call> call, Throwable t) {
                Toast.makeText(CallActivity.this, "Failed to answer call", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void rejectCall() {
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.rejectCall(callId, token).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(retrofit2.Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    finish();
                }
            }

            @Override
            public void onFailure(retrofit2.Call<Void> call, Throwable t) {
                Toast.makeText(CallActivity.this, "Failed to reject call", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void endCall() {
        ApiService apiService = RetrofitClient.getApiService();
        String token = "Bearer " + sessionManager.getToken();

        apiService.endCall(callId, token).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(retrofit2.Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    finish();
                }
            }

            @Override
            public void onFailure(retrofit2.Call<Void> call, Throwable t) {
                Toast.makeText(CallActivity.this, "Failed to end call", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void updateUIForActiveCall() {
        answerButton.setEnabled(false);
        rejectButton.setEnabled(false);
        endCallButton.setEnabled(true);
        callTypeTextView.setText(callType + " call in progress");
    }

    private String generateSDP() {
        // Simplified SDP generation
        // In production, use WebRTC libraries
        return "v=0\r\n" +
                "o=- 0 0 IN IP4 127.0.0.1\r\n" +
                "s=-\r\n" +
                "t=0 0\r\n" +
                "a=group:BUNDLE 0\r\n" +
                "a=msid-semantic: WMS stream\r\n";
    }
}
