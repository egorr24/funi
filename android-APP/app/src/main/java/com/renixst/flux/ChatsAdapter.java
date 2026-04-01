package com.renixst.flux;

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import com.renixst.flux.models.Chat;
import java.util.List;

public class ChatsAdapter extends ArrayAdapter<Chat> {

    private Activity context;
    private List<Chat> chats;

    public ChatsAdapter(Activity context, List<Chat> chats) {
        super(context, R.layout.chat_item, chats);
        this.context = context;
        this.chats = chats;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View vi = convertView;
        if (convertView == null)
            vi = LayoutInflater.from(context).inflate(R.layout.chat_item, parent, false);

        Chat chat = chats.get(position);

        TextView titleView = vi.findViewById(R.id.chatTitle);
        TextView kindView = vi.findViewById(R.id.chatKind);

        titleView.setText(chat.title != null ? chat.title : "Без названия");
        kindView.setText(chat.kind != null ? chat.kind : "PERSONAL");

        return vi;
    }
}
