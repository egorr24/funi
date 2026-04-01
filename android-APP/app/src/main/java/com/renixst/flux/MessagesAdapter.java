package com.renixst.flux;

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import com.renixst.flux.api.RetrofitClient;
import com.renixst.flux.models.Message;
import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class MessagesAdapter extends ArrayAdapter<Message> {

    private Activity context;
    private List<Message> messages;
    private String currentUserId;

    public MessagesAdapter(Activity context, List<Message> messages) {
        super(context, R.layout.message_item, messages);
        this.context = context;
        this.messages = messages;
        this.currentUserId = RetrofitClient.getUserId();
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View vi = convertView;
        if (convertView == null)
            vi = LayoutInflater.from(context).inflate(R.layout.message_item, parent, false);

        Message message = messages.get(position);

        TextView senderView = vi.findViewById(R.id.messageSender);
        TextView bodyView = vi.findViewById(R.id.messageBody);
        TextView timeView = vi.findViewById(R.id.messageTime);

        senderView.setText(message.senderName != null ? message.senderName : "Unknown");
        bodyView.setText(message.encryptedBody);

        if (message.createdAt != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
            timeView.setText(sdf.format(message.createdAt));
        }

        // Different styling for current user's messages
        if (currentUserId != null && currentUserId.equals(message.senderId)) {
            bodyView.setTextColor(context.getResources().getColor(android.R.color.holo_green_light));
        }

        return vi;
    }
}
