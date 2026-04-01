package com.renixst.flux;

import android.app.Activity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import com.renixst.flux.models.User;
import java.util.List;

public class UsersAdapter extends ArrayAdapter<User> {

    private Activity context;
    private List<User> users;

    public UsersAdapter(Activity context, List<User> users) {
        super(context, R.layout.user_item, users);
        this.context = context;
        this.users = users;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        View vi = convertView;
        if (convertView == null)
            vi = LayoutInflater.from(context).inflate(R.layout.user_item, parent, false);

        User user = users.get(position);

        TextView nameView = vi.findViewById(R.id.userName);
        TextView emailView = vi.findViewById(R.id.userEmail);
        TextView statusView = vi.findViewById(R.id.userStatus);

        nameView.setText(user.name != null ? user.name : "Unknown");
        emailView.setText(user.email);
        statusView.setText(user.status != null ? user.status : "offline");
        statusView.setTextColor(context.getResources().getColor(
            "online".equals(user.status) ? android.R.color.holo_green_light : android.R.color.darker_gray
        ));

        return vi;
    }
}
