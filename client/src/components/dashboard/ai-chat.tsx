import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  message: string;
  isFromUser: boolean;
  createdAt: string;
}

export default function AIChat() {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/messages", { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  return (
    <Card className="bg-card border-border" data-testid="ai-chat">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>AI Assistant</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="status-indicator status-active"></div>
            <span className="text-xs text-muted-foreground" data-testid="ai-status">Online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-4 max-h-64 overflow-y-auto" data-testid="chat-messages">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="no-messages">
                Start a conversation with the AI assistant! Try asking about your repositories or documentation.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${msg.isFromUser ? 'justify-end' : ''}`}
                  data-testid={`message-${index}`}
                >
                  {!msg.isFromUser && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="text-primary-foreground text-xs" />
                    </div>
                  )}
                  <div className={`flex-1 ${msg.isFromUser ? 'text-right' : ''}`}>
                    <div
                      className={`p-3 rounded-lg inline-block max-w-xs ${
                        msg.isFromUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      <p className="text-sm" data-testid={`message-${index}-content`}>
                        {msg.message}
                      </p>
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 ${msg.isFromUser ? 'text-right' : ''}`}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  {msg.isFromUser && (
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-muted-foreground text-xs" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border pt-4">
            <form onSubmit={handleSubmit} className="flex space-x-2" data-testid="chat-form">
              <Input
                type="text"
                placeholder="Ask about your repositories..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-input border-border"
                disabled={sendMessageMutation.isPending}
                data-testid="input-message"
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-send"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2" data-testid="chat-help">
              Try: "Who added the deleteUser function?" or "Generate release notes for this week"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
