# Generated by Django 2.2.24 on 2021-10-05 18:48

from django.db import migrations, models

import emails.models


class Migration(migrations.Migration):
    dependencies = [
        ("emails", "0023_add_profile_server_storage_and_relayaddress_generated_for"),
    ]

    operations = [
        migrations.AlterField(
            model_name="profile",
            name="subdomain",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=63,
                null=True,
                unique=True,
                validators=[emails.models.valid_available_subdomain],
            ),
        ),
    ]
