# Generated by Django 2.2.24 on 2021-08-31 20:29

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("emails", "0019_merge_20210825_1737"),
    ]

    operations = [
        migrations.AddField(
            model_name="reply",
            name="created_at",
            field=models.DateField(
                auto_now_add=True, default=django.utils.timezone.now
            ),
            preserve_default=False,
        ),
    ]
